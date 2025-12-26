import express from 'express';
import { body, param } from 'express-validator';
import { validate } from '../../../core/middleware/validation.js';
import { authenticate } from '../../../server/middleware/auth.js';
import {
  createOrganizationHandler,
  getOrganizationHandler,
  getAllOrganizationsHandler,
  updateOrganizationHandler,
  changeStatusHandler,
  addUserHandler,
  getOrganizationUsersHandler,
  removeUserHandler
} from '../controllers/organizationController.js';

const router = express.Router();

/**
 * @route   POST /api/organizations
 * @desc    Create new organization
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  [
    body('name').trim().notEmpty().withMessage('Nome organizzazione obbligatorio'),
    body('organizationType').isIn(['PUBLIC_ENTITY', 'PRIVATE_COMPANY', 'NON_PROFIT']).withMessage('Tipo organizzazione non valido'),
    body('email').isEmail().withMessage('Email non valida'),
    body('phone').optional().isMobilePhone('any'),
    body('vatNumber').optional().trim(),
    body('fiscalCode').optional().trim()
  ],
  validate,
  createOrganizationHandler
);

/**
 * @route   GET /api/organizations
 * @desc    Get all organizations
 * @access  Private (admin)
 */
router.get('/', authenticate, getAllOrganizationsHandler);

/**
 * @route   GET /api/organizations/:id
 * @desc    Get organization by ID
 * @access  Private
 */
router.get('/:id', authenticate, getOrganizationHandler);

/**
 * @route   PUT /api/organizations/:id
 * @desc    Update organization
 * @access  Private (organization admin)
 */
router.put('/:id', authenticate, updateOrganizationHandler);

/**
 * @route   PATCH /api/organizations/:id/status
 * @desc    Change organization status
 * @access  Private (admin only)
 */
router.patch(
  '/:id/status',
  authenticate,
  [
    body('status').isIn(['pending', 'active', 'suspended', 'inactive']).withMessage('Status non valido')
  ],
  validate,
  changeStatusHandler
);

/**
 * @route   POST /api/organizations/:id/users
 * @desc    Add user to organization
 * @access  Private (organization admin)
 */
router.post(
  '/:id/users',
  authenticate,
  [
    body('userId').isInt().withMessage('User ID non valido'),
    body('role').isIn(['admin', 'operator', 'viewer']).withMessage('Ruolo non valido')
  ],
  validate,
  addUserHandler
);

/**
 * @route   GET /api/organizations/:id/users
 * @desc    Get organization users
 * @access  Private
 */
router.get('/:id/users', authenticate, getOrganizationUsersHandler);

/**
 * @route   DELETE /api/organizations/:id/users/:userId
 * @desc    Remove user from organization
 * @access  Private (organization admin)
 */
router.delete('/:id/users/:userId', authenticate, removeUserHandler);

export default router;
