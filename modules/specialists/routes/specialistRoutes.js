import express from 'express';
import { body } from 'express-validator';
import { validate } from '../../../core/middleware/validation.js';
import { authenticate } from '../../../server/middleware/auth.js';
import {
  registerCandidate,
  startExam,
  submitExamHandler,
  addCPE,
  getDashboard
} from '../controllers/specialistController.js';

const router = express.Router();

router.post('/register', authenticate, [
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
