import express from 'express';
import { body } from 'express-validator';
import { validate } from '../../../core/middleware/validation.js';
import { authenticate } from '../../../server/middleware/auth.js';
import {
  startMFASetup,
  verifyMFA,
  validateMFAToken,
  disableMFAHandler,
  getMFAStatusHandler,
  regenerateBackupCodesHandler
} from '../controllers/mfaController.js';

const router = express.Router();

/**
 * @route   POST /api/auth/mfa/setup
 * @desc    Start MFA setup (generate QR code and secret)
 * @access  Private (authenticated users)
 */
router.post('/setup', authenticate, startMFASetup);

/**
 * @route   POST /api/auth/mfa/verify
 * @desc    Verify TOTP token and enable MFA
 * @access  Private (authenticated users)
 */
router.post(
  '/verify',
  authenticate,
  [
    body('token')
      .trim()
      .notEmpty()
      .withMessage('Codice TOTP obbligatorio')
      .isLength({ min: 6, max: 6 })
      .withMessage('Il codice deve essere di 6 cifre')
  ],
  validate,
  verifyMFA
);

/**
 * @route   POST /api/auth/mfa/validate
 * @desc    Validate MFA token during login
 * @access  Public (but requires userId)
 */
router.post(
  '/validate',
  [
    body('userId')
      .isInt()
      .withMessage('User ID non valido'),
    body('token')
      .trim()
      .notEmpty()
      .withMessage('Codice obbligatorio')
  ],
  validate,
  validateMFAToken
);

/**
 * @route   POST /api/auth/mfa/disable
 * @desc    Disable MFA for user
 * @access  Private (authenticated users)
 */
router.post(
  '/disable',
  authenticate,
  [
    body('password')
      .trim()
      .notEmpty()
      .withMessage('Password obbligatoria')
  ],
  validate,
  disableMFAHandler
);

/**
 * @route   GET /api/auth/mfa/status
 * @desc    Get MFA status for current user
 * @access  Private (authenticated users)
 */
router.get('/status', authenticate, getMFAStatusHandler);

/**
 * @route   POST /api/auth/mfa/backup-codes/regenerate
 * @desc    Regenerate backup codes
 * @access  Private (authenticated users)
 */
router.post(
  '/backup-codes/regenerate',
  authenticate,
  [
    body('password')
      .trim()
      .notEmpty()
      .withMessage('Password obbligatoria')
  ],
  validate,
  regenerateBackupCodesHandler
);

export default router;
