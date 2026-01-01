import { pool } from '../../../server/config/database.js';
import { calculateAggregates } from '../../../lib/db_json.js';

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
  // Convert assessment_data from DB format ("1-1") to calculation format ("1.1")
  const assessmentsForCalc = {};

  for (const [key, data] of Object.entries(assessmentData)) {
    const indicatorId = key.replace('-', '.'); // "1-1" -> "1.1"

    // Extract bayesian_score from raw_data if available, otherwise from value
    let bayesianScore;
    if (data.raw_data?.client_conversation?.scores?.final_score !== undefined) {
      bayesianScore = data.raw_data.client_conversation.scores.final_score;
    } else {
      const value = data.value || 0;
      bayesianScore = value === 0 ? 0 : value / 3;
    }

    // Get confidence from raw_data or use default
    const confidence = data.raw_data?.client_conversation?.scores?.confidence || 0.85;

    assessmentsForCalc[indicatorId] = {
      bayesian_score: bayesianScore,
      confidence: confidence
    };
  }

  // Get organization data for industry
  const orgResult = await pool.query('SELECT industry, metadata FROM organizations WHERE id = $1', [organizationId]);
  const industry = orgResult.rows[0]?.industry || orgResult.rows[0]?.metadata?.industry || 'General';

  // Recalculate aggregates (maturity_model, category_stats, etc.)
  const aggregates = calculateAggregates(assessmentsForCalc, industry);

  // Build metadata object
  const updatedMetadata = {
    completion_percentage: aggregates.completion.percentage,
    assessed_indicators: aggregates.completion.assessed_indicators,
    total_indicators: 100,
    overall_risk: aggregates.overall_risk,
    maturity_level: aggregates.maturity_model.level_name.toLowerCase(),
    overall_confidence: aggregates.overall_confidence,
    category_stats: aggregates.by_category,
    maturity_model: aggregates.maturity_model,
    generated_at: new Date().toISOString(),
    generator: 'Auto-calculated on update'
  };

  // Update with recalculated metadata
  const query = `UPDATE cpf_auditing_assessments
                 SET assessment_data = $1, metadata = $2, last_assessment_date = CURRENT_TIMESTAMP
                 WHERE organization_id = $3 AND deleted_at IS NULL
                 RETURNING *`;
  const params = [JSON.stringify(assessmentData), JSON.stringify(updatedMetadata), organizationId];

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
