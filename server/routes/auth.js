import express from 'express';
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  verifyEmail
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import {
  registerValidationRules,
  loginValidationRules,
  profileUpdateValidationRules,
  changePasswordValidationRules,
  validate
} from '../middleware/authValidation.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', registerValidationRules, validate, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidationRules, validate, login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post('/logout', logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, profileUpdateValidationRules, validate, updateProfile);

/**
 * @route   PUT /api/auth/password
 * @desc    Change password
 * @access  Private
 */
router.put('/password', authenticate, changePasswordValidationRules, validate, changePassword);

/**
 * @route   GET /api/auth/verify/:token
 * @desc    Verify email
 * @access  Private
 */
router.get('/verify/:token', authenticate, verifyEmail);

export default router;
