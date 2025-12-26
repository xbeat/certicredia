import { pool } from '../../../core/database/connection.js';
import { auditLog } from '../../audit/services/auditService.js';
import logger from '../../../core/utils/logger.js';
import crypto from 'crypto';

/**
 * Workflow Service
 * Manages assessment workflow and specialist assignments
 */

// Assessment status transitions
const VALID_TRANSITIONS = {
  'draft': ['in_progress', 'submitted'],
  'in_progress': ['submitted'],
  'submitted': ['under_review', 'modification_requested'],
  'under_review': ['modification_requested', 'approved', 'rejected'],
  'modification_requested': ['in_progress'],
  'approved': ['expired'],
  'rejected': [],
  'expired': []
};

/**
 * Create assessment
 */
export const createAssessment = async (organizationId, templateId, createdBy) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO assessments (organization_id, template_id, status)
       VALUES ($1, $2, 'draft')
       RETURNING *`,
      [organizationId, templateId]
    );

    const assessment = result.rows[0];

    await client.query('COMMIT');

    logger.success(`✅ Assessment creato per org #${organizationId} (ID: ${assessment.id})`);

    await auditLog({
      userId: createdBy,
      organizationId,
      action: 'ASSESSMENT_CREATED',
      entityType: 'assessment',
      entityId: assessment.id,
      newValue: assessment
    });

    return assessment;

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore creazione assessment:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update assessment status with validation
 */
export const updateAssessmentStatus = async (assessmentId, newStatus, userId) => {
  const client = await pool.connect();

  try {
    const result = await client.query(
      'SELECT status, organization_id FROM assessments WHERE id = $1',
      [assessmentId]
    );

    if (result.rows.length === 0) {
      throw new Error('Assessment non trovato');
    }

    const currentStatus = result.rows[0].status;
    const organizationId = result.rows[0].organization_id;

    // Validate transition
    if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus)) {
      throw new Error(`Transizione non valida: ${currentStatus} → ${newStatus}`);
    }

    // Update status
    await client.query(
      `UPDATE assessments
       SET status = $1, updated_at = CURRENT_TIMESTAMP,
           submitted_at = CASE WHEN $1 = 'submitted' THEN CURRENT_TIMESTAMP ELSE submitted_at END,
           reviewed_at = CASE WHEN $1 = 'approved' OR $1 = 'rejected' THEN CURRENT_TIMESTAMP ELSE reviewed_at END,
           approved_at = CASE WHEN $1 = 'approved' THEN CURRENT_TIMESTAMP ELSE approved_at END,
           expires_at = CASE WHEN $1 = 'approved' THEN CURRENT_TIMESTAMP + INTERVAL '12 months' ELSE expires_at END
       WHERE id = $2`,
      [newStatus, assessmentId]
    );

    logger.info(`✅ Assessment #${assessmentId}: ${currentStatus} → ${newStatus}`);

    await auditLog({
      userId,
      organizationId,
      action: 'ASSESSMENT_STATUS_CHANGED',
      entityType: 'assessment',
      entityId: assessmentId,
      oldValue: { status: currentStatus },
      newValue: { status: newStatus }
    });

    return { success: true, oldStatus: currentStatus, newStatus };

  } catch (error) {
    logger.error('Errore cambio status assessment:', error);
    throw error;
  }
};

/**
 * Generate specialist assignment token
 */
export const generateAssignmentToken = async (assessmentId, organizationId, createdBy) => {
  const client = await pool.connect();

  try {
    // Generate token
    const token = `ACC-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + (parseInt(process.env.SPECIALIST_ASSIGNMENT_TOKEN_EXPIRY) || 72) * 60 * 60 * 1000);

    await client.query('BEGIN');

    await client.query(
      `INSERT INTO specialist_assignments (
        assessment_id, organization_id, access_token, token_hash, expires_at, created_by, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [assessmentId, organizationId, token, tokenHash, expiresAt, createdBy]
    );

    await client.query('COMMIT');

    logger.success(`✅ Token assegnazione generato per assessment #${assessmentId}: ${token}`);

    return { token, expiresAt };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore generazione token:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Accept assignment with token
 */
export const acceptAssignment = async (token, specialistId) => {
  const client = await pool.connect();

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await client.query(
      `SELECT * FROM specialist_assignments
       WHERE token_hash = $1 AND status = 'pending' AND expires_at > CURRENT_TIMESTAMP`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      throw new Error('Token non valido o scaduto');
    }

    const assignment = result.rows[0];

    await client.query('BEGIN');

    // Update assignment
    await client.query(
      `UPDATE specialist_assignments
       SET specialist_id = $1, status = 'accepted', accepted_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [specialistId, assignment.id]
    );

    // Update assessment
    await client.query(
      `UPDATE assessments
       SET assigned_specialist_id = $1, assigned_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [specialistId, assignment.assessment_id]
    );

    await client.query('COMMIT');

    logger.success(`✅ Specialist #${specialistId} ha accettato assessment #${assignment.assessment_id}`);

    return { success: true, assessmentId: assignment.assessment_id };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore accettazione assignment:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default {
  createAssessment,
  updateAssessmentStatus,
  generateAssignmentToken,
  acceptAssignment
};
