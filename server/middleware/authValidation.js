import { body, validationResult } from 'express-validator';

/**
 * Validation rules for registration
 */
export const registerValidationRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('L\'email è obbligatoria')
    .isEmail()
    .withMessage('Formato email non valido')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email troppo lunga'),

  body('password')
    .notEmpty()
    .withMessage('La password è obbligatoria')
    .isLength({ min: 8 })
    .withMessage('La password deve essere di almeno 8 caratteri')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La password deve contenere almeno una lettera maiuscola, una minuscola e un numero'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Il nome è obbligatorio')
    .isLength({ min: 2, max: 255 })
    .withMessage('Il nome deve essere tra 2 e 255 caratteri')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Il nome contiene caratteri non validi'),

  body('company')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Nome azienda troppo lungo'),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[\d\s()+.-]+$/)
    .withMessage('Numero di telefono non valido')
    .isLength({ max: 50 })
    .withMessage('Numero di telefono troppo lungo'),
];

/**
 * Validation rules for login
 */
export const loginValidationRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('L\'email è obbligatoria')
    .isEmail()
    .withMessage('Formato email non valido')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('La password è obbligatoria'),
];

/**
 * Validation rules for profile update
 */
export const profileUpdateValidationRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Il nome deve essere tra 2 e 255 caratteri')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Il nome contiene caratteri non validi'),

  body('company')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Nome azienda troppo lungo'),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[\d\s()+.-]+$/)
    .withMessage('Numero di telefono non valido')
    .isLength({ max: 50 })
    .withMessage('Numero di telefono troppo lungo'),

  body('address')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Indirizzo troppo lungo'),

  body('city')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Città troppo lunga'),

  body('postal_code')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 })
    .withMessage('CAP troppo lungo'),

  body('country')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Paese troppo lungo'),
];

/**
 * Validation rules for password change
 */
export const changePasswordValidationRules = [
  body('currentPassword')
    .notEmpty()
    .withMessage('La password attuale è obbligatoria'),

  body('newPassword')
    .notEmpty()
    .withMessage('La nuova password è obbligatoria')
    .isLength({ min: 8 })
    .withMessage('La nuova password deve essere di almeno 8 caratteri')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La nuova password deve contenere almeno una lettera maiuscola, una minuscola e un numero'),
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
