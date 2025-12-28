import {
  registerSpecialistCandidate,
  generateExam,
  submitExam,
  addCPERecord,
  getSpecialistDashboard,
  getAllSpecialists
} from '../services/specialistService.js';
import logger from '../../../server/utils/logger.js';
import bcrypt from 'bcrypt';
import pool from '../../../server/config/database.js';

const SALT_ROUNDS = 10;

export const registerCandidate = async (req, res) => {
  try {
    const profile = await registerSpecialistCandidate(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Registrazione specialist completata. Ora puoi sostenere l\'esame.',
      data: profile
    });
  } catch (error) {
    logger.error('Error registering specialist:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const startExam = async (req, res) => {
  try {
    const exam = await generateExam(req.user.id);

    res.json({
      success: true,
      message: 'Esame generato. Hai 120 minuti per completarlo.',
      data: exam
    });
  } catch (error) {
    logger.error('Error starting exam:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const submitExamHandler = async (req, res) => {
  try {
    const { attemptId, answers } = req.body;
    const result = await submitExam(attemptId, answers, req.user.id);

    res.json({
      success: true,
      message: result.passed ? '🎉 Congratulazioni! Hai superato l\'esame!' : 'Esame non superato. Riprova.',
      data: result
    });
  } catch (error) {
    logger.error('Error submitting exam:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const addCPE = async (req, res) => {
  try {
    const cpe = await addCPERecord(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Attività CPE registrata con successo',
      data: cpe
    });
  } catch (error) {
    logger.error('Error adding CPE:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboard = async (req, res) => {
  try {
    const dashboard = await getSpecialistDashboard(req.user.id);

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    logger.error('Error getting dashboard:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllSpecialistsHandler = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      search: req.query.search,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const result = await getAllSpecialists(filters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error getting specialists:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/specialists/register
 * Public registration endpoint for specialists
 * Creates user + specialist profile in one transaction
 */
export const registerSpecialistPublicHandler = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      experienceYears,
      bio,
      password
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || experienceYears === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Campi obbligatori mancanti'
      });
    }

    await client.query('BEGIN');

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Email già registrata'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, name, role, phone, active, email_verified)
       VALUES ($1, $2, $3, 'specialist', $4, true, false)
       RETURNING id`,
      [email, passwordHash, `${firstName} ${lastName}`, phone || null]
    );

    const userId = userResult.rows[0].id;

    // Create specialist profile
    await client.query(
      `INSERT INTO specialist_profiles (
        user_id,
        experience_years,
        bio,
        status,
        exam_attempts,
        exam_passed
      )
      VALUES ($1, $2, $3, 'candidate', 0, false)`,
      [userId, experienceYears, bio || null]
    );

    await client.query('COMMIT');

    logger.info(`Nuovo specialist registrato: ${firstName} ${lastName} (User ID: ${userId})`);

    res.status(201).json({
      success: true,
      message: 'Registrazione completata! Il tuo account è in attesa di verifica. Dovrai sostenere l\'esame di qualificazione.',
      data: {
        userId: userId
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore registrazione specialist:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Errore durante la registrazione'
    });
  } finally {
    client.release();
  }
};
