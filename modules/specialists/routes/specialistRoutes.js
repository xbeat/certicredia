import express from 'express';
import { body } from 'express-validator';
import { validate } from '../../../core/middleware/validation.js';
import { authenticate } from '../../../server/middleware/auth.js';
import {
  registerCandidate,
  startExam,
  submitExamHandler,
  addCPE,
  getDashboard,
  getAllSpecialistsHandler,
  registerSpecialistPublicHandler
} from '../controllers/specialistController.js';

const router = express.Router();

router.get('/', authenticate, getAllSpecialistsHandler);

// Public registration endpoint
router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('Nome obbligatorio'),
  body('lastName').trim().notEmpty().withMessage('Cognome obbligatorio'),
  body('email').isEmail().withMessage('Email non valida'),
  body('password').isLength({ min: 12 }).withMessage('Password min 12 caratteri'),
  body('experienceYears').isInt({ min: 0 }).withMessage('Anni esperienza obbligatori')
], validate, registerSpecialistPublicHandler);

// Authenticated endpoint for existing users to create specialist profile
router.post('/register-profile', authenticate, [
  body('experienceYears').isInt({ min: 0 }).withMessage('Years of experience required'),
  body('bio').optional().trim()
], validate, registerCandidate);

router.post('/exam/start', authenticate, startExam);

router.post('/exam/submit', authenticate, [
  body('attemptId').isInt().withMessage('Attempt ID required'),
  body('answers').isArray().withMessage('Answers array required')
], validate, submitExamHandler);

router.post('/cpe', authenticate, [
  body('activityType').isIn(['training', 'audit', 'research', 'teaching', 'conference', 'other']),
  body('title').trim().notEmpty(),
  body('hours').isFloat({ min: 0 }),
  body('credits').isFloat({ min: 0 }),
  body('activityDate').isISO8601()
], validate, addCPE);

router.get('/dashboard', authenticate, getDashboard);

export default router;
