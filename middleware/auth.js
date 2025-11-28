/**
 * Authentication Middleware
 * JWT-based authentication
 */

const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header or cookie
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if session is still valid
    const sessionResult = await query(
      'SELECT * FROM sessions WHERE token_hash = $1 AND is_valid = TRUE AND expires_at > NOW()',
      [token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { message: 'Session expired or invalid' }
      });
    }

    // Get user data
    const userResult = await query(
      'SELECT id, email, first_name, last_name, role, language, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not found or inactive' }
      });
    }

    // Attach user to request
    req.user = userResult.rows[0];
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired token' }
      });
    }
    next(error);
  }
};

/**
 * Check if user has required role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions' }
      });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userResult = await query(
        'SELECT id, email, first_name, last_name, role, language FROM users WHERE id = $1 AND is_active = TRUE',
        [decoded.userId]
      );

      if (userResult.rows.length > 0) {
        req.user = userResult.rows[0];
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};
