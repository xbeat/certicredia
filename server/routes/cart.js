import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeCart
} from '../controllers/cartController.js';
import { optionalAuth, authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, getCart);
router.post('/', optionalAuth, addToCart);
router.put('/:id', optionalAuth, updateCartItem);
router.delete('/:id', optionalAuth, removeFromCart);
router.delete('/', optionalAuth, clearCart);
router.post('/merge', authenticate, mergeCart);

export default router;
