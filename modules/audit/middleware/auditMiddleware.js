import { auditLog } from '../services/auditService.js';

/**
 * Audit Middleware
 * Automatically logs actions performed via API endpoints
 *
 * Usage:
 *   router.post('/users', auditMiddleware('USER_CREATED', 'user'), createUser);
 */

/**
 * Create audit middleware for specific action
 *
 * @param {string} action - Action name (e.g., 'USER_CREATED')
 * @param {string} entityType - Entity type (e.g., 'user')
 * @param {Object} options - Additional options
 * @param {Function} options.getEntityId - Function to extract entity ID from response
 * @param {Function} options.getOldValue - Function to get old value (for updates)
 * @param {Function} options.getNewValue - Function to get new value
 * @param {Function} options.getOrganizationId - Function to extract organization ID
 */
export const auditMiddleware = (action, entityType, options = {}) => {
  return async (req, res, next) => {
    // Store original functions
    const originalJson = res.json;
    const originalSend = res.send;

    // Override res.json to capture response
    res.json = function (body) {
      captureAudit(req, res, body);
      return originalJson.call(this, body);
    };

    // Override res.send to capture response
    res.send = function (body) {
      captureAudit(req, res, body);
      return originalSend.call(this, body);
    };

    const captureAudit = async (req, res, responseBody) => {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          // Extract entity ID
          let entityId = null;
          if (options.getEntityId) {
            entityId = options.getEntityId(req, res, responseBody);
          } else if (req.params.id) {
            entityId = parseInt(req.params.id);
          } else if (responseBody?.data?.id) {
            entityId = responseBody.data.id;
          }

          // Extract values
          const oldValue = options.getOldValue ? options.getOldValue(req, res) : null;
          const newValue = options.getNewValue
            ? options.getNewValue(req, res, responseBody)
            : (responseBody?.data || req.body);

          // Extract organization ID
          const organizationId = options.getOrganizationId
            ? options.getOrganizationId(req, res)
            : (req.user?.organizationId || null);

          // Log audit event
          await auditLog({
            userId: req.user?.id || null,
            userEmail: req.user?.email || null,
            userRole: req.user?.role || null,
            organizationId,
            action,
            entityType,
            entityId,
            oldValue,
            newValue,
            req,
            metadata: {
              method: req.method,
              path: req.path,
              query: req.query
            }
          });

        } catch (error) {
          // Log error but don't fail the request
          console.error('Audit middleware error:', error);
        }
      }
    };

    next();
  };
};

/**
 * Audit decorator for controller functions
 * Use this to manually trigger audit logging in controllers
 *
 * Usage:
 *   const createUser = audit('USER_CREATED', 'user')(async (req, res) => {
 *     // ... controller logic
 *   });
 */
export const audit = (action, entityType, options = {}) => {
  return (controllerFn) => {
    return async (req, res, ...args) => {
      // Execute controller
      const result = await controllerFn(req, res, ...args);

      // Log audit if successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const entityId = options.getEntityId
            ? options.getEntityId(req, res, result)
            : (req.params.id || result?.id);

          const organizationId = options.getOrganizationId
            ? options.getOrganizationId(req, res)
            : (req.user?.organizationId || null);

          await auditLog({
            userId: req.user?.id || null,
            userEmail: req.user?.email || null,
            userRole: req.user?.role || null,
            organizationId,
            action,
            entityType,
            entityId,
            oldValue: options.getOldValue ? options.getOldValue(req, res) : null,
            newValue: options.getNewValue ? options.getNewValue(req, res, result) : (result || req.body),
            req
          });
        } catch (error) {
          console.error('Audit decorator error:', error);
        }
      }

      return result;
    };
  };
};

export default { auditMiddleware, audit };
