import express from 'express';
import {
  submitContact,
  getAllContacts,
  getContactById,
  updateContactStatus
} from '../controllers/contactController.js';
import {
  contactValidationRules,
  validate,
  contactRateLimiter
} from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   POST /api/contact
 * @desc    Submit contact form
 * @access  Public
 */
router.post(
  '/',
  contactRateLimiter,
  contactValidationRules,
  validate,
  submitContact
);

/**
 * @route   GET /api/contact
 * @desc    Get all contacts (admin endpoint - add authentication in production)
 * @access  Admin (currently public - TODO: add auth middleware)
 */
router.get('/', getAllContacts);

/**
 * @route   GET /api/contact/:id
 * @desc    Get contact by ID (admin endpoint)
 * @access  Admin (currently public - TODO: add auth middleware)
 */
router.get('/:id', getContactById);

/**
 * @route   PUT /api/contact/:id
 * @desc    Update contact status (admin endpoint)
 * @access  Admin (currently public - TODO: add auth middleware)
 */
router.put('/:id', updateContactStatus);

export default router;
