import { pool } from '../../../server/config/database.js';

/**
 * CPF Auditing Service
 * Handles business logic for CPF auditing assessments
 */

/**
 * Get assessment for an organization
 * @param {number} organizationId - Organization ID
 * @returns {Promise<Object|null>} Assessment data or null if not found
 */
export async function getAssessmentByOrganization(organizationId) {
  const result = await pool.query(
    `SELECT a.*, o.name as organization_name, o.organization_type, o.status as organization_status
     FROM cpf_auditing_assessments a
     JOIN organizations o ON a.organization_id = o.id
     WHERE a.organization_id = $1 AND a.deleted_at IS NULL`,
    [organizationId]
  );

  return result.rows[0] || null;
}

/**
 * Get all assessments (with organization details)
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} List of assessments
 */
export async function getAllAssessments(filters = {}) {
  const { limit = 100, offset = 0, includeDeleted = false } = filters;

  let query = `
    SELECT
      a.id,
      a.organization_id,
      a.metadata,
      a.created_at,
      a.updated_at,
      a.last_assessment_date,
      a.deleted_at,
      o.name as organization_name,
      o.organization_type,
      o.status as organization_status
    FROM cpf_auditing_assessments a
    JOIN organizations o ON a.organization_id = o.id
  `;

  const conditions = [];
  const params = [];
  let paramCount = 1;

  if (!includeDeleted) {
    conditions.push('a.deleted_at IS NULL');
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ` ORDER BY a.updated_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Create a new assessment for an organization
 * @param {number} organizationId - Organization ID
 * @param {Object} assessmentData - Initial assessment data
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Created assessment
 */
export async function createAssessment(organizationId, assessmentData = {}, metadata = {}) {
  // Check if assessment already exists for this organization
  const existing = await getAssessmentByOrganization(organizationId);
  if (existing) {
    throw new Error('Assessment already exists for this organization');
  }

  const result = await pool.query(
    `INSERT INTO cpf_auditing_assessments (organization_id, assessment_data, metadata, last_assessment_date)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     RETURNING *`,
    [organizationId, JSON.stringify(assessmentData), JSON.stringify(metadata)]
  );

  return result.rows[0];
}

/**
 * Update assessment data
 * @param {number} organizationId - Organization ID
 * @param {Object} assessmentData - Updated assessment data
 * @param {Object} metadata - Updated metadata
 * @returns {Promise<Object>} Updated assessment
 */
export async function updateAssessment(organizationId, assessmentData, metadata = null) {
  let query = `UPDATE cpf_auditing_assessments
               SET assessment_data = $1, last_assessment_date = CURRENT_TIMESTAMP`;
  const params = [JSON.stringify(assessmentData)];
  let paramCount = 2;

  if (metadata !== null) {
    query += `, metadata = $${paramCount++}`;
    params.push(JSON.stringify(metadata));
  }

  query += ` WHERE organization_id = $${paramCount++} AND deleted_at IS NULL RETURNING *`;
  params.push(organizationId);

  const result = await pool.query(query, params);

  if (result.rows.length === 0) {
    throw new Error('Assessment not found');
  }

  return result.rows[0];
}

/**
 * Soft delete an assessment (move to trash)
 * @param {number} organizationId - Organization ID
 * @returns {Promise<Object>} Deleted assessment
 */
export async function softDeleteAssessment(organizationId) {
  const result = await pool.query(
    `UPDATE cpf_auditing_assessments
     SET deleted_at = CURRENT_TIMESTAMP
     WHERE organization_id = $1 AND deleted_at IS NULL
     RETURNING *`,
    [organizationId]
  );

  if (result.rows.length === 0) {
    throw new Error('Assessment not found');
  }

  return result.rows[0];
}

/**
 * Restore assessment from trash
 * @param {number} organizationId - Organization ID
 * @returns {Promise<Object>} Restored assessment
 */
export async function restoreAssessment(organizationId) {
  const result = await pool.query(
    `UPDATE cpf_auditing_assessments
     SET deleted_at = NULL
     WHERE organization_id = $1 AND deleted_at IS NOT NULL
     RETURNING *`,
    [organizationId]
  );

  if (result.rows.length === 0) {
    throw new Error('Deleted assessment not found');
  }

  return result.rows[0];
}

/**
 * Permanently delete an assessment
 * @param {number} organizationId - Organization ID
 * @returns {Promise<boolean>} True if deleted
 */
export async function permanentlyDeleteAssessment(organizationId) {
  const result = await pool.query(
    'DELETE FROM cpf_auditing_assessments WHERE organization_id = $1 RETURNING id',
    [organizationId]
  );

  return result.rows.length > 0;
}

/**
 * Get deleted assessments (trash)
 * @returns {Promise<Array>} List of deleted assessments
 */
export async function getDeletedAssessments() {
  const result = await pool.query(
    `SELECT
      a.id,
      a.organization_id,
      a.metadata,
      a.created_at,
      a.updated_at,
      a.deleted_at,
      o.name as organization_name,
      o.organization_type
    FROM cpf_auditing_assessments a
    JOIN organizations o ON a.organization_id = o.id
    WHERE a.deleted_at IS NOT NULL
    ORDER BY a.deleted_at DESC`
  );

  return result.rows;
}

/**
 * Get assessment statistics
 * @returns {Promise<Object>} Statistics object
 */
export async function getAssessmentStatistics() {
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_active,
      COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as total_deleted,
      COUNT(*) as total_all,
      AVG(CASE
        WHEN deleted_at IS NULL AND metadata->>'completion_percentage' IS NOT NULL
        THEN (metadata->>'completion_percentage')::numeric
        ELSE NULL
      END) as avg_completion,
      COUNT(*) FILTER (WHERE deleted_at IS NULL AND last_assessment_date > CURRENT_DATE - INTERVAL '30 days') as recent_updates
    FROM cpf_auditing_assessments
  `);

  return result.rows[0];
}

export default {
  getAssessmentByOrganization,
  getAllAssessments,
  createAssessment,
  updateAssessment,
  softDeleteAssessment,
  restoreAssessment,
  permanentlyDeleteAssessment,
  getDeletedAssessments,
  getAssessmentStatistics
};
