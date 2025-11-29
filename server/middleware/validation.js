import { body, validationResult } from 'express-validator';

/**
 * Validation rules for contact form
 */
export const contactValidationRules = [
  body('userType')
    .isIn(['COMPANY', 'SPECIALIST'])
    .withMessage('Tipo utente non valido'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Il nome è obbligatorio')
    .isLength({ min: 2, max: 255 })
    .withMessage('Il nome deve essere tra 2 e 255 caratteri')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Il nome contiene caratteri non validi'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('L\'email è obbligatoria')
    .isEmail()
    .withMessage('Formato email non valido')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email troppo lunga'),

  body('company')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Nome azienda troppo lungo'),

  body('linkedin')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('URL LinkedIn non valido')
    .isLength({ max: 500 })
    .withMessage('URL LinkedIn troppo lungo'),

  body('message')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Messaggio troppo lungo (max 5000 caratteri)'),
];

/**
 * Middleware to check validation results
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }

  next();
};

/**
 * Rate limiting middleware for contact form
 * Additional layer beyond global rate limiting
 */
export const contactRateLimiter = (req, res, next) => {
  // This could be enhanced with Redis for distributed rate limiting
  // For now, the global rate limiter in server/index.js will handle this
  next();
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (req, res, next) => {
  // Basic XSS prevention - already handled by express-validator's trim()
  // Additional sanitization can be added here if needed
  next();
};
