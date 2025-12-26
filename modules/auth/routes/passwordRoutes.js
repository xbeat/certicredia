import express from 'express';
import { body, param } from 'express-validator';
import { validate } from '../../../core/middleware/validation.js';
import {
  forgotPassword,
  resetPasswordHandler,
  validateResetTokenHandler
} from '../controllers/passwordController.js';

const router = express.Router();

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post(
  '/forgot-password',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Email non valida')
      .normalizeEmail()
  ],
  validate,
  forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  [
    body('token')
      .trim()
      .notEmpty()
      .withMessage('Token obbligatorio'),
    body('newPassword')
      .trim()
      .notEmpty()
      .withMessage('Nuova password obbligatoria')
      .isLength({ min: parseInt(process.env.PASSWORD_MIN_LENGTH) || 12 })
      .withMessage(`Password deve contenere almeno ${parseInt(process.env.PASSWORD_MIN_LENGTH) || 12} caratteri`)
  ],
  validate,
  resetPasswordHandler
);

/**
 * @route   GET /api/auth/validate-reset-token/:token
 * @desc    Validate if reset token is valid
 * @access  Public
 */
router.get(
  '/validate-reset-token/:token',
  [
    param('token')
      .trim()
      .notEmpty()
      .withMessage('Token obbligatorio')
  ],
  validate,
  validateResetTokenHandler
);

export default router;
