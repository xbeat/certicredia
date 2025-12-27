import { pool } from '../../../server/config/database.js';
import { auditLog } from '../../audit/services/auditService.js';
import logger from '../../../server/utils/logger.js';

/**
 * Specialist Service
 * Complete specialist management: registration, exams, CPE
 */

const EXAM_CONFIG = {
  questionsCount: parseInt(process.env.SPECIALIST_EXAM_QUESTIONS_COUNT) || 50,
  passingScore: parseInt(process.env.SPECIALIST_EXAM_PASS_SCORE) || 80,
  timeLimit: parseInt(process.env.SPECIALIST_EXAM_TIME_LIMIT_MINUTES) || 120,
  maxAttempts: parseInt(process.env.SPECIALIST_EXAM_MAX_ATTEMPTS) || 3
};

/**
 * Register as specialist candidate
 */
export const registerSpecialistCandidate = async (userId, profileData) => {
  const client = await pool.connect();

  try {
    const { qualifications, certifications, experienceYears, bio, cvUrl, linkedinUrl } = profileData;

    await client.query('BEGIN');

    // Update user role
    await client.query(
      "UPDATE users SET role = 'specialist' WHERE id = $1",
      [userId]
    );

    // Create specialist profile
    const result = await client.query(
      `INSERT INTO specialist_profiles (
        user_id, status, qualifications, certifications,
        experience_years, bio, cv_url, linkedin_url
      ) VALUES ($1, 'candidate', $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [userId, qualifications || [], certifications || [], experienceYears, bio, cvUrl, linkedinUrl]
    );

    await client.query('COMMIT');

    const profile = result.rows[0];

    logger.success(`✅ Specialist candidate registered: user #${userId}`);

    await auditLog({
      userId,
      action: 'SPECIALIST_REGISTERED',
      entityType: 'specialist_profile',
      entityId: profile.id,
      newValue: profile
    });

    return profile;

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error registering specialist candidate:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Generate randomized exam
 */
export const generateExam = async (userId) => {
  const client = await pool.connect();

  try {
    // Check if user can take exam
    const profileResult = await client.query(
      'SELECT * FROM specialist_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0) {
      throw new Error('Specialist profile not found');
    }

    const profile = profileResult.rows[0];

    if (profile.exam_attempts >= EXAM_CONFIG.maxAttempts) {
      throw new Error(`Maximum attempts (${EXAM_CONFIG.maxAttempts}) reached`);
    }

    if (profile.exam_passed) {
      throw new Error('Exam already passed');
    }

    // Get random questions (stratified by difficulty)
    const questions = await client.query(
      `(SELECT id, category, difficulty, question, options
        FROM specialist_exam_questions
        WHERE active = true AND difficulty = 'easy'
        ORDER BY RANDOM() LIMIT 15)
       UNION ALL
       (SELECT id, category, difficulty, question, options
        FROM specialist_exam_questions
        WHERE active = true AND difficulty = 'medium'
        ORDER BY RANDOM() LIMIT 25)
       UNION ALL
       (SELECT id, category, difficulty, question, options
        FROM specialist_exam_questions
        WHERE active = true AND difficulty = 'hard'
        ORDER BY RANDOM() LIMIT 10)`
    );

    if (questions.rows.length < EXAM_CONFIG.questionsCount) {
      throw new Error('Not enough questions in database');
    }

    // Shuffle final questions
    const shuffledQuestions = questions.rows.sort(() => Math.random() - 0.5);

    // Create exam attempt
    await client.query('BEGIN');

    const attemptResult = await client.query(
      `INSERT INTO specialist_exam_attempts (
        user_id, specialist_profile_id, questions, answers,
        score, passed, started_at
      ) VALUES ($1, $2, $3, '[]', 0, false, CURRENT_TIMESTAMP)
      RETURNING id`,
      [userId, profile.id, JSON.stringify(shuffledQuestions.map(q => q.id))]
    );

    await client.query('COMMIT');

    const attemptId = attemptResult.rows[0].id;

    logger.info(`✅ Exam generated for user #${userId} (attempt ${profile.exam_attempts + 1}/${EXAM_CONFIG.maxAttempts})`);

    // Return questions without correct answers
    const examQuestions = shuffledQuestions.map(q => ({
      id: q.id,
      category: q.category,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options
    }));

    return {
      attemptId,
      questions: examQuestions,
      timeLimit: EXAM_CONFIG.timeLimit,
      passingScore: EXAM_CONFIG.passingScore,
      attemptNumber: profile.exam_attempts + 1,
      maxAttempts: EXAM_CONFIG.maxAttempts
    };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error generating exam:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Submit exam and calculate score
 */
export const submitExam = async (attemptId, answers, userId) => {
  const client = await pool.connect();

  try {
    // Get attempt
    const attemptResult = await client.query(
      'SELECT * FROM specialist_exam_attempts WHERE id = $1 AND user_id = $2',
      [attemptId, userId]
    );

    if (attemptResult.rows.length === 0) {
      throw new Error('Exam attempt not found');
    }

    const attempt = attemptResult.rows[0];

    if (attempt.completed_at) {
      throw new Error('Exam already submitted');
    }

    // Get questions with correct answers
    const questionIds = JSON.parse(attempt.questions);
    const questionsResult = await client.query(
      'SELECT id, correct_answer FROM specialist_exam_questions WHERE id = ANY($1)',
      [questionIds]
    );

    // Calculate score
    let correctAnswers = 0;
    const questionsMap = new Map(questionsResult.rows.map(q => [q.id, q.correct_answer]));

    for (const answer of answers) {
      if (questionsMap.get(answer.questionId) === answer.selectedAnswer) {
        correctAnswers++;
      }
    }

    const score = (correctAnswers / questionIds.length) * 100;
    const passed = score >= EXAM_CONFIG.passingScore;

    await client.query('BEGIN');

    // Update attempt
    await client.query(
      `UPDATE specialist_exam_attempts
       SET answers = $1, score = $2, passed = $3, completed_at = CURRENT_TIMESTAMP,
           time_taken_minutes = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at)) / 60
       WHERE id = $4`,
      [JSON.stringify(answers), score, passed, attemptId]
    );

    // Update specialist profile
    const profileUpdate = passed
      ? `UPDATE specialist_profiles
         SET exam_passed = true, exam_score = $1, exam_passed_at = CURRENT_TIMESTAMP,
             exam_attempts = exam_attempts + 1, status = 'active', activated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2`
      : `UPDATE specialist_profiles
         SET exam_attempts = exam_attempts + 1, exam_score = GREATEST(exam_score, $1), status = 'candidate'
         WHERE user_id = $2`;

    await client.query(profileUpdate, [score, userId]);

    await client.query('COMMIT');

    logger.success(`✅ Exam submitted by user #${userId}: ${score.toFixed(2)}% (${passed ? 'PASSED' : 'FAILED'})`);

    await auditLog({
      userId,
      action: passed ? 'SPECIALIST_EXAM_PASSED' : 'SPECIALIST_EXAM_FAILED',
      entityType: 'specialist_exam_attempt',
      entityId: attemptId,
      newValue: { score, passed, correctAnswers, totalQuestions: questionIds.length }
    });

    return {
      score: parseFloat(score.toFixed(2)),
      passed,
      correctAnswers,
      totalQuestions: questionIds.length,
      passingScore: EXAM_CONFIG.passingScore
    };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error submitting exam:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Add CPE record
 */
export const addCPERecord = async (userId, cpeData) => {
  const client = await pool.connect();

  try {
    const {
      activityType, title, description, provider, hours, credits,
      activityDate, certificateUrl, evidenceUrls
    } = cpeData;

    // Get specialist profile
    const profileResult = await client.query(
      'SELECT id FROM specialist_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0) {
      throw new Error('Specialist profile not found');
    }

    const profileId = profileResult.rows[0].id;

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO specialist_cpe_records (
        specialist_profile_id, user_id, activity_type, title, description,
        provider, hours, credits, activity_date, certificate_url, evidence_urls
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [profileId, userId, activityType, title, description, provider, hours, credits, activityDate, certificateUrl, evidenceUrls || []]
    );

    // Update total CPE hours
    const currentYear = new Date().getFullYear();
    const activityYear = new Date(activityDate).getFullYear();

    if (activityYear === currentYear) {
      await client.query(
        `UPDATE specialist_profiles
         SET cpe_hours_current_year = cpe_hours_current_year + $1,
             cpe_hours_total = cpe_hours_total + $1
         WHERE id = $2`,
        [credits, profileId]
      );
    } else {
      await client.query(
        'UPDATE specialist_profiles SET cpe_hours_total = cpe_hours_total + $1 WHERE id = $2',
        [credits, profileId]
      );
    }

    await client.query('COMMIT');

    const cpeRecord = result.rows[0];

    logger.success(`✅ CPE record added for specialist #${userId}: ${credits} credits`);

    await auditLog({
      userId,
      action: 'CPE_RECORD_ADDED',
      entityType: 'specialist_cpe_record',
      entityId: cpeRecord.id,
      newValue: cpeRecord
    });

    return cpeRecord;

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error adding CPE record:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get specialist dashboard data
 */
export const getSpecialistDashboard = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT
        sp.*,
        u.name, u.email,
        (SELECT COUNT(*) FROM specialist_assignments WHERE specialist_id = $1 AND status = 'accepted') as active_assessments,
        (SELECT COUNT(*) FROM assessments WHERE assigned_specialist_id = $1 AND status = 'approved') as completed_assessments,
        (SELECT SUM(credits) FROM specialist_cpe_records WHERE user_id = $1 AND EXTRACT(YEAR FROM activity_date) = EXTRACT(YEAR FROM CURRENT_DATE)) as current_year_cpe
       FROM specialist_profiles sp
       JOIN users u ON sp.user_id = u.id
       WHERE sp.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Specialist profile not found');
    }

    return result.rows[0];

  } catch (error) {
    logger.error('Error getting specialist dashboard:', error);
    throw error;
  }
};

export default {
  registerSpecialistCandidate,
  generateExam,
  submitExam,
  addCPERecord,
  getSpecialistDashboard
};
