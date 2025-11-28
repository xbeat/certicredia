/**
 * Authentication Routes
 * Login, Register, Logout
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('company').optional().trim(),
    body('jobTitle').optional().trim(),
    body('language').optional().isIn(['it', 'en'])
  ],
  async (req, res, next) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const { email, password, firstName, lastName, company, jobTitle, language = 'it' } = req.body;

      // Check if user already exists
      const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: { message: 'Email already registered' }
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

      // Create user
      const result = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name, company, job_title, language, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'customer')
         RETURNING id, email, first_name, last_name, role, language`,
        [email, passwordHash, firstName, lastName, company, jobTitle, language]
      );

      const user = result.rows[0];

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Store session
      await query(
        `INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`,
        [user.id, token, req.ip, req.get('user-agent')]
      );

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            language: user.language
          },
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res, next) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const { email, password } = req.body;

      // Get user
      const result = await query(
        'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: { message: 'Invalid credentials' }
        });
      }

      const user = result.rows[0];

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          error: { message: 'Invalid credentials' }
        });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Store session
      await query(
        `INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`,
        [user.id, token, req.ip, req.get('user-agent')]
      );

      // Update last login
      await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            language: user.language
          },
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/logout
 * Logout user (invalidate session)
 */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    // Invalidate session
    await query(
      'UPDATE sessions SET is_valid = FALSE WHERE token_hash = $1',
      [req.token]
    );

    res.json({
      success: true,
      data: { message: 'Logged out successfully' }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

module.exports = router;
