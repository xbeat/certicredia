import { verifyToken, extractTokenFromHeader } from '../config/auth.js';
import { pool } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header or cookies
    let token = extractTokenFromHeader(req.headers.authorization);

    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Autenticazione richiesta. Effettua il login.'
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const result = await pool.query(
      'SELECT id, email, name, role, active, email_verified FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Account disabilitato. Contatta il supporto.'
      });
    }

    // Attach user to request object
    req.user = user;
    next();

  } catch (error) {
    logger.error('Errore autenticazione:', error);

    if (error.message === 'Token non valido o scaduto') {
      return res.status(401).json({
        success: false,
        message: 'Sessione scaduta. Effettua nuovamente il login.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Errore durante l\'autenticazione'
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticazione richiesta'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accesso negato. Privilegi amministratore richiesti.'
    });
  }

  next();
};

/**
 * Middleware to optionally authenticate (doesn't fail if no token)
 * Useful for routes that work both for authenticated and guest users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token = extractTokenFromHeader(req.headers.authorization);

    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = verifyToken(token);

    const result = await pool.query(
      'SELECT id, email, name, role, active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length > 0 && result.rows[0].active) {
      req.user = result.rows[0];
    } else {
      req.user = null;
    }

    next();

  } catch (error) {
    // If token is invalid, just continue without user
    req.user = null;
    next();
  }
};

/**
 * Middleware to check email verification
 */
export const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticazione richiesta'
    });
  }

  if (!req.user.email_verified) {
    return res.status(403).json({
      success: false,
      message: 'Email non verificata. Controlla la tua casella di posta.',
      emailVerificationRequired: true
    });
  }

  next();
};
