import { pool } from '../../../server/config/database.js';
import { auditLog } from '../../audit/services/auditService.js';
import logger from '../../../server/utils/logger.js';

/**
 * Review Comments Service
 * Specialist feedback system for assessments
 */

/**
 * Add review comment
 */
export const addComment = async (commentData, specialistId) => {
  const client = await pool.connect();

  try {
    const { assessmentId, questionId, commentType, comment, severity } = commentData;

    const result = await client.query(
      `INSERT INTO review_comments (
        assessment_id, specialist_id, question_id, comment_type, comment, severity, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'open')
      RETURNING *`,
      [assessmentId, specialistId, questionId, commentType, comment, severity || 'info']
    );

    const reviewComment = result.rows[0];

    logger.info(`✅ Review comment added to assessment #${assessmentId} by specialist #${specialistId}`);

    await auditLog({
      userId: specialistId,
      action: 'REVIEW_COMMENT_ADDED',
      entityType: 'review_comment',
      entityId: reviewComment.id,
      newValue: reviewComment
    });

    return reviewComment;

  } catch (error) {
    logger.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Get comments for assessment
 */
export const getAssessmentComments = async (assessmentId) => {
  try {
    const result = await pool.query(
      `SELECT
        rc.*,
        u.name as specialist_name, u.email as specialist_email
       FROM review_comments rc
       JOIN users u ON rc.specialist_id = u.id
       WHERE rc.assessment_id = $1
       ORDER BY rc.created_at DESC`,
      [assessmentId]
    );

    return result.rows;

  } catch (error) {
    logger.error('Error getting comments:', error);
    throw error;
  }
};

/**
 * Resolve comment
 */
export const resolveComment = async (commentId, resolutionNote, resolvedBy) => {
  try {
    await pool.query(
      `UPDATE review_comments
       SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP,
           resolved_by = $1, resolution_note = $2
       WHERE id = $3`,
      [resolvedBy, resolutionNote, commentId]
    );

    logger.info(`✅ Comment #${commentId} resolved by user #${resolvedBy}`);

    await auditLog({
      userId: resolvedBy,
      action: 'REVIEW_COMMENT_RESOLVED',
      entityType: 'review_comment',
      entityId: commentId,
      newValue: { resolved: true, resolutionNote }
    });

    return { success: true };

  } catch (error) {
    logger.error('Error resolving comment:', error);
    throw error;
  }
};

/**
 * Get review comments with filters
 */
export const getReviewComments = async (filters = {}) => {
  try {
    let query = `
      SELECT
        rc.*,
        u.name as specialist_name, u.email as specialist_email
      FROM review_comments rc
      LEFT JOIN users u ON rc.user_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (filters.assessmentId) {
      query += ` AND rc.assessment_id = $${paramCount++}`;
      params.push(filters.assessmentId);
    }

    if (filters.section) {
      query += ` AND rc.section = $${paramCount++}`;
      params.push(filters.section);
    }

    if (filters.resolved !== undefined) {
      query += ` AND rc.resolved = $${paramCount++}`;
      params.push(filters.resolved);
    }

    query += ` ORDER BY rc.created_at DESC`;

    const result = await pool.query(query, params);

    return result.rows;

  } catch (error) {
    logger.error('Error getting review comments:', error);
    throw error;
  }
};

/**
 * Resolve review comment
 */
export const resolveReviewComment = async (commentId, resolvedBy, resolution) => {
  try {
    await pool.query(
      `UPDATE review_comments
       SET resolved = true,
           resolved_at = CURRENT_TIMESTAMP,
           resolved_by = $1,
           resolution = $2
       WHERE id = $3`,
      [resolvedBy, resolution, commentId]
    );

    logger.info(`✅ Review comment #${commentId} resolved by user #${resolvedBy}`);

    await auditLog({
      userId: resolvedBy,
      action: 'REVIEW_COMMENT_RESOLVED',
      entityType: 'review_comment',
      entityId: commentId,
      newValue: { resolved: true, resolution }
    });

    return { success: true };

  } catch (error) {
    logger.error('Error resolving review comment:', error);
    throw error;
  }
};

// Alias for compatibility
export const addReviewComment = addComment;

export default {
  addComment,
  addReviewComment,
  getAssessmentComments,
  getReviewComments,
  resolveComment,
  resolveReviewComment
};
