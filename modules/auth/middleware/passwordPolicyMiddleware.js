import { validatePasswordStrength } from '../services/passwordService.js';

/**
 * Password Policy Middleware
 * Validates password strength according to configured policy
 */

export const validatePasswordPolicy = (req, res, next) => {
  const password = req.body.password || req.body.newPassword;

  if (!password) {
    // If no password in request, skip validation
    // (this allows using middleware on routes that may or may not have password)
    return next();
  }

  const validation = validatePasswordStrength(password);

  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: 'Password non conforme alla policy di sicurezza',
      errors: validation.errors
    });
  }

  next();
};
