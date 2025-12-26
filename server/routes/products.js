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

// Admin routes (must be before /:slug to avoid conflict)
router.get('/admin/all', authenticate, requireAdmin, getAllProductsAdmin);
router.post('/', authenticate, requireAdmin, createProduct);
router.put('/:id', authenticate, requireAdmin, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

// Public routes (/:slug must be last to avoid matching admin routes)
router.get('/', getAllProducts);
router.get('/:slug', getProductBySlug);

export default router;
