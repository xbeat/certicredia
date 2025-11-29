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

// User routes
router.post('/', authenticate, createOrder);
router.get('/', authenticate, getUserOrders);
router.get('/:id', authenticate, getOrderById);
router.post('/payment/intent', authenticate, createPaymentIntent);

// Admin routes  
router.get('/admin/all', authenticate, requireAdmin, getAllOrders);
router.put('/:id/status', authenticate, requireAdmin, updateOrderStatus);

export default router;
