import { pool } from '../../../server/config/database.js';
import { auditLog } from '../../audit/services/auditService.js';
import logger from '../../../server/utils/logger.js';
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

/**
 * Assign specialist to assessment
 */
export const assignSpecialist = async (assignmentData) => {
  const client = await pool.connect();

  try {
    const { assessmentId, specialistId, assignedBy, expiresInDays = 30 } = assignmentData;

    const token = `ACC-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO specialist_assignments (
        assessment_id, specialist_id, assigned_by, access_token, expires_at, status
      ) VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING *`,
      [assessmentId, specialistId, assignedBy, token, expiresAt]
    );

    await client.query('COMMIT');

    logger.info(`✅ Specialist ${specialistId} assigned to assessment ${assessmentId}`);

    return result.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error assigning specialist:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get assignment by token
 */
export const getAssignmentByToken = async (token) => {
  try {
    const result = await pool.query(
      `SELECT sa.*, a.organization_id, o.name as organization_name
       FROM specialist_assignments sa
       LEFT JOIN assessments a ON sa.assessment_id = a.id
       LEFT JOIN organizations o ON a.organization_id = o.id
       WHERE sa.access_token = $1 AND sa.expires_at > NOW()`,
      [token]
    );

    return result.rows[0] || null;

  } catch (error) {
    logger.error('Error getting assignment by token:', error);
    throw error;
  }
};

/**
 * Revoke assignment
 */
export const revokeAssignment = async (assignmentId) => {
  try {
    await pool.query(
      `UPDATE specialist_assignments
       SET status = 'revoked', revoked_at = NOW()
       WHERE id = $1`,
      [assignmentId]
    );

    logger.info(`✅ Assignment ${assignmentId} revoked`);

    return { success: true };

  } catch (error) {
    logger.error('Error revoking assignment:', error);
    throw error;
  }
};

/**
 * Get all assignments with filters
 */
export const getAllAssignments = async (filters = {}) => {
  try {
    let query = `
      SELECT sa.*,
        a.id as assessment_id,
        o.name as organization_name,
        u.name as specialist_name
      FROM specialist_assignments sa
      LEFT JOIN assessments a ON sa.assessment_id = a.id
      LEFT JOIN organizations o ON a.organization_id = o.id
      LEFT JOIN users u ON sa.specialist_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (filters.assessmentId) {
      query += ` AND sa.assessment_id = $${paramCount++}`;
      params.push(filters.assessmentId);
    }

    if (filters.specialistId) {
      query += ` AND sa.specialist_id = $${paramCount++}`;
      params.push(filters.specialistId);
    }

    if (filters.status) {
      query += ` AND sa.status = $${paramCount++}`;
      params.push(filters.status);
    }

    query += ` ORDER BY sa.assigned_at DESC`;

    const result = await pool.query(query, params);

    return result.rows;

  } catch (error) {
    logger.error('Error getting all assignments:', error);
    throw error;
  }
};

export default {
  createAssessment,
  updateAssessmentStatus,
  generateAssignmentToken,
  acceptAssignment,
  assignSpecialist,
  getAssignmentByToken,
  revokeAssignment,
  getAllAssignments
};
