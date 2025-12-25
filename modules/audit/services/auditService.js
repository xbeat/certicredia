import { pool } from '../../../core/database/connection.js';
import logger from '../../../core/utils/logger.js';

/**
 * Audit Trail Service
 * Provides indelebile (tamper-proof) audit logging for all critical operations
 *
 * Usage:
 *   await auditLog({
 *     userId: req.user.id,
 *     action: 'USER_LOGIN',
 *     entityType: 'user',
 *     entityId: user.id,
 *     oldValue: null,
 *     newValue: { email: user.email },
 *     req
 *   });
 */

/**
 * Mask sensitive fields in audit logs
 */
const maskSensitiveFields = (data) => {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = (process.env.AUDIT_MASKED_FIELDS || 'password,password_hash,mfa_secret,credit_card').split(',');
  const masked = { ...data };

  for (const field of sensitiveFields) {
    if (field in masked) {
      masked[field] = '***MASKED***';
    }
  }

  // Recursively mask nested objects
  for (const key in masked) {
    if (masked[key] && typeof masked[key] === 'object' && !Array.isArray(masked[key])) {
      masked[key] = maskSensitiveFields(masked[key]);
    }
  }

  return masked;
};

/**
 * Calculate diff between old and new values
 */
const calculateChanges = (oldValue, newValue) => {
  if (!oldValue || !newValue) return null;

  const changes = {};

  // Find changed fields
  for (const key in newValue) {
    if (JSON.stringify(oldValue[key]) !== JSON.stringify(newValue[key])) {
      changes[key] = {
        from: oldValue[key],
        to: newValue[key]
      };
    }
  }

  // Find removed fields
  for (const key in oldValue) {
    if (!(key in newValue)) {
      changes[key] = {
        from: oldValue[key],
        to: null
      };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
};

/**
 * Log an audit event
 *
 * @param {Object} params
 * @param {number} params.userId - User performing the action
 * @param {string} params.userEmail - User email
 * @param {string} params.userRole - User role
 * @param {number} params.organizationId - Organization context (if applicable)
 * @param {string} params.action - Action performed (e.g., 'USER_LOGIN', 'ASSESSMENT_CREATED')
 * @param {string} params.entityType - Type of entity affected (e.g., 'user', 'assessment')
 * @param {number} params.entityId - ID of entity affected
 * @param {Object} params.oldValue - Previous state (for updates)
 * @param {Object} params.newValue - New state
 * @param {Object} params.req - Express request object (optional, for IP/user-agent)
 * @param {Object} params.metadata - Additional metadata
 */
export const auditLog = async ({
  userId = null,
  userEmail = null,
  userRole = null,
  organizationId = null,
  action,
  entityType,
  entityId = null,
  oldValue = null,
  newValue = null,
  req = null,
  metadata = null
}) => {
  // Skip if audit is disabled
  if (process.env.AUDIT_ENABLED === 'false') {
    return;
  }

  try {
    // Mask sensitive data
    const maskedOldValue = oldValue ? maskSensitiveFields(oldValue) : null;
    const maskedNewValue = newValue ? maskSensitiveFields(newValue) : null;

    // Calculate changes
    const changes = calculateChanges(maskedOldValue, maskedNewValue);

    // Extract IP and user-agent from request
    const ipAddress = req ? (
      req.ip ||
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress
    ) : null;

    const userAgent = req ? req.headers['user-agent'] : null;

    // Extract session/request ID if available
    const requestId = req ? req.id : null;
    const sessionId = req?.session?.id || null;

    // Insert audit log
    await pool.query(
      `INSERT INTO audit_logs (
        user_id, user_email, user_role, organization_id,
        action, entity_type, entity_id,
        old_value, new_value, changes,
        ip_address, user_agent,
        request_id, session_id,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        userId,
        userEmail,
        userRole,
        organizationId,
        action,
        entityType,
        entityId,
        maskedOldValue ? JSON.stringify(maskedOldValue) : null,
        maskedNewValue ? JSON.stringify(maskedNewValue) : null,
        changes ? JSON.stringify(changes) : null,
        ipAddress,
        userAgent,
        requestId,
        sessionId,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    // Log to console in debug mode
    if (process.env.DEBUG === 'true') {
      logger.debug(`📝 Audit: ${action} on ${entityType}${entityId ? `#${entityId}` : ''} by user#${userId}`);
    }

  } catch (error) {
    // CRITICAL: Audit logging should NEVER fail silently
    logger.error('❌ CRITICAL: Audit log failed:', error);
    logger.error('Audit data:', { userId, action, entityType, entityId });

    // In production, you might want to send an alert here
    // e.g., send email to admins, trigger monitoring alert, etc.

    // Re-throw to ensure caller knows audit failed
    throw new Error(`Audit logging failed: ${error.message}`);
  }
};

/**
 * Query audit logs
 *
 * @param {Object} filters
 * @param {number} filters.userId - Filter by user
 * @param {number} filters.organizationId - Filter by organization
 * @param {string} filters.action - Filter by action
 * @param {string} filters.entityType - Filter by entity type
 * @param {number} filters.entityId - Filter by entity ID
 * @param {Date} filters.startDate - Filter by start date
 * @param {Date} filters.endDate - Filter by end date
 * @param {number} filters.limit - Limit results (default: 100)
 * @param {number} filters.offset - Offset for pagination
 */
export const queryAuditLogs = async (filters = {}) => {
  try {
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (filters.userId) {
      conditions.push(`user_id = $${paramCount++}`);
      params.push(filters.userId);
    }

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramCount++}`);
      params.push(filters.organizationId);
    }

    if (filters.action) {
      conditions.push(`action = $${paramCount++}`);
      params.push(filters.action);
    }

    if (filters.entityType) {
      conditions.push(`entity_type = $${paramCount++}`);
      params.push(filters.entityType);
    }

    if (filters.entityId) {
      conditions.push(`entity_id = $${paramCount++}`);
      params.push(filters.entityId);
    }

    if (filters.startDate) {
      conditions.push(`timestamp >= $${paramCount++}`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`timestamp <= $${paramCount++}`);
      params.push(filters.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    const query = `
      SELECT * FROM audit_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Count total matching records
    const countQuery = `
      SELECT COUNT(*) FROM audit_logs
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, params.slice(0, params.length - 2));
    const total = parseInt(countResult.rows[0].count);

    return {
      logs: result.rows,
      total,
      limit,
      offset,
      hasMore: total > (offset + limit)
    };

  } catch (error) {
    logger.error('Error querying audit logs:', error);
    throw error;
  }
};

/**
 * Get audit trail for specific entity
 */
export const getEntityAuditTrail = async (entityType, entityId, limit = 50) => {
  try {
    const result = await pool.query(
      `SELECT * FROM audit_logs
       WHERE entity_type = $1 AND entity_id = $2
       ORDER BY timestamp DESC
       LIMIT $3`,
      [entityType, entityId, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting entity audit trail:', error);
    throw error;
  }
};

/**
 * Clean old audit logs (respecting retention policy)
 * Should be run by cron job
 */
export const cleanOldAuditLogs = async () => {
  const retentionDays = parseInt(process.env.AUDIT_RETENTION_DAYS) || 0;

  if (retentionDays === 0) {
    logger.info('ℹ️  Audit retention is set to infinite (0 days). Skipping cleanup.');
    return { deleted: 0 };
  }

  try {
    const result = await pool.query(
      `DELETE FROM audit_logs
       WHERE timestamp < NOW() - INTERVAL '${retentionDays} days'`
    );

    logger.info(`🧹 Cleaned ${result.rowCount} old audit logs (older than ${retentionDays} days)`);

    return { deleted: result.rowCount };
  } catch (error) {
    logger.error('Error cleaning old audit logs:', error);
    throw error;
  }
};

/**
 * Get audit statistics
 */
export const getAuditStats = async (startDate = null, endDate = null) => {
  try {
    const dateFilter = startDate && endDate
      ? `WHERE timestamp BETWEEN $1 AND $2`
      : '';
    const params = startDate && endDate ? [startDate, endDate] : [];

    const result = await pool.query(`
      SELECT
        COUNT(*) as total_events,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT organization_id) as unique_organizations,
        action,
        entity_type,
        COUNT(*) as action_count
      FROM audit_logs
      ${dateFilter}
      GROUP BY action, entity_type
      ORDER BY action_count DESC
      LIMIT 20
    `, params);

    return result.rows;
  } catch (error) {
    logger.error('Error getting audit stats:', error);
    throw error;
  }
};

export default {
  auditLog,
  queryAuditLogs,
  getEntityAuditTrail,
  cleanOldAuditLogs,
  getAuditStats
};
