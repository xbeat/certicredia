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
import { authenticate, requireAdmin } from '../middleware/auth.js';

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
 * @desc    Get all contacts (admin endpoint)
 * @access  Admin
 */
router.get('/', authenticate, requireAdmin, getAllContacts);

/**
 * @route   GET /api/contact/:id
 * @desc    Get contact by ID (admin endpoint)
 * @access  Admin
 */
router.get('/:id', authenticate, requireAdmin, getContactById);

/**
 * @route   PUT /api/contact/:id
 * @desc    Update contact status (admin endpoint)
 * @access  Admin
 */
router.put('/:id', authenticate, requireAdmin, updateContactStatus);

export default router;
