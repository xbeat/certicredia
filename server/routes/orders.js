import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  createPaymentIntent
} from '../controllers/orderController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin routes (must be before /:id to avoid conflict)
router.get('/admin/all', authenticate, requireAdmin, getAllOrders);
router.put('/:id/status', authenticate, requireAdmin, updateOrderStatus);

// User routes (/:id must be after specific routes)
router.post('/', authenticate, createOrder);
router.get('/', authenticate, getUserOrders);
router.post('/payment/intent', authenticate, createPaymentIntent);
router.get('/:id', authenticate, getOrderById);

export default router;
