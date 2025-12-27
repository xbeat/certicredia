import {
  requestPasswordReset,
  validateResetToken,
  resetPassword,
  validatePasswordStrength
} from '../services/passwordService.js';
import logger from '../../../server/utils/logger.js';

/**
 * Password Recovery Controller
 * Handles forgot password and reset password endpoints
 */

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email obbligatoria'
      });
    }

    const result = await requestPasswordReset(email.trim().toLowerCase());

    res.json(result);

  } catch (error) {
    logger.error('Errore forgot password:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante la richiesta di reset password'
    });
  }
};

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
export const resetPasswordHandler = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validate input
    if (!token || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Token obbligatorio'
      });
    }

    if (!newPassword || !newPassword.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nuova password obbligatoria'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Password non valida',
        errors: passwordValidation.errors
      });
    }

    const result = await resetPassword(token.trim(), newPassword);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    logger.error('Errore reset password:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante il reset della password'
    });
  }
};

/**
 * GET /api/auth/validate-reset-token/:token
 * Validate if reset token is valid (for frontend to check before showing form)
 */
export const validateResetTokenHandler = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Token obbligatorio'
      });
    }

    const validation = await validateResetToken(token.trim());

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    res.json({
      success: true,
      message: 'Token valido',
      data: {
        email: validation.email
      }
    });

  } catch (error) {
    logger.error('Errore validazione token:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante la validazione del token'
    });
  }
};
