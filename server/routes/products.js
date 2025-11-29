import express from 'express';
import {
  getAllProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin
} from '../controllers/productController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/:slug', getProductBySlug);

// Admin routes
router.post('/', authenticate, requireAdmin, createProduct);
router.put('/:id', authenticate, requireAdmin, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);
router.get('/admin/all', authenticate, requireAdmin, getAllProductsAdmin);

export default router;
