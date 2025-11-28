/**
 * Ecommerce Routes
 * Cart, Checkout, Orders
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/ecommerce/cart
 * Get user's cart
 */
router.get('/cart', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
        ci.id,
        ci.quantity,
        p.id as product_id,
        p.sku,
        p.type,
        CASE WHEN $2 = 'it' THEN p.name_it ELSE p.name_en END as name,
        p.price,
        p.currency,
        p.image_url,
        (p.price * ci.quantity) as subtotal
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1 AND p.status = 'active'`,
      [req.user.id, req.user.language || 'it']
    );

    const items = result.rows;
    const total = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    res.json({
      success: true,
      data: {
        items,
        summary: {
          itemsCount: items.length,
          subtotal: total.toFixed(2),
          currency: 'EUR'
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ecommerce/cart
 * Add item to cart
 */
router.post('/cart',
  authenticate,
  [
    body('productId').isUUID(),
    body('quantity').isInt({ min: 1, max: 100 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const { productId, quantity } = req.body;

      // Check if product exists
      const productResult = await query(
        'SELECT id, stock_quantity FROM products WHERE id = $1 AND status = \'active\'',
        [productId]
      );

      if (productResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: { message: 'Product not found' }
        });
      }

      const product = productResult.rows[0];

      // Check stock (if not unlimited)
      if (product.stock_quantity !== -1 && product.stock_quantity < quantity) {
        return res.status(400).json({
          success: false,
          error: { message: 'Insufficient stock' }
        });
      }

      // Add or update cart item
      await query(
        `INSERT INTO cart_items (user_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, product_id)
         DO UPDATE SET quantity = cart_items.quantity + $3, updated_at = NOW()`,
        [req.user.id, productId, quantity]
      );

      res.status(201).json({
        success: true,
        data: { message: 'Item added to cart' }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/ecommerce/cart/:itemId
 * Update cart item quantity
 */
router.put('/cart/:itemId',
  authenticate,
  [body('quantity').isInt({ min: 0, max: 100 })],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const { itemId } = req.params;
      const { quantity } = req.body;

      if (quantity === 0) {
        // Remove item
        await query(
          'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
          [itemId, req.user.id]
        );
      } else {
        // Update quantity
        await query(
          'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3',
          [quantity, itemId, req.user.id]
        );
      }

      res.json({
        success: true,
        data: { message: 'Cart updated' }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/ecommerce/cart/:itemId
 * Remove item from cart
 */
router.delete('/cart/:itemId', authenticate, async (req, res, next) => {
  try {
    await query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
      [req.params.itemId, req.user.id]
    );

    res.json({
      success: true,
      data: { message: 'Item removed from cart' }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ecommerce/checkout
 * Create order from cart
 */
router.post('/checkout',
  authenticate,
  [
    body('billingEmail').isEmail(),
    body('billingFirstName').trim().notEmpty(),
    body('billingLastName').trim().notEmpty(),
    body('billingCompany').optional().trim(),
    body('billingVatNumber').optional().trim(),
    body('billingAddress').trim().notEmpty(),
    body('billingCity').trim().notEmpty(),
    body('billingPostalCode').trim().notEmpty(),
    body('billingCountry').trim().isLength({ min: 2, max: 2 }),
    body('paymentMethod').isIn(['stripe', 'paypal', 'bank_transfer'])
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Validation failed', details: errors.array() }
        });
      }

      const billingData = req.body;

      // Use transaction for atomic order creation
      const order = await transaction(async (client) => {
        // Get cart items
        const cartResult = await client.query(
          `SELECT ci.*, p.price, p.vat_rate, p.name_it, p.sku
           FROM cart_items ci
           JOIN products p ON ci.product_id = p.id
           WHERE ci.user_id = $1 AND p.status = 'active'`,
          [req.user.id]
        );

        if (cartResult.rows.length === 0) {
          throw new Error('Cart is empty');
        }

        // Calculate totals
        let subtotal = 0;
        let vatAmount = 0;

        cartResult.rows.forEach(item => {
          const itemSubtotal = parseFloat(item.price) * item.quantity;
          subtotal += itemSubtotal;
          vatAmount += (itemSubtotal * parseFloat(item.vat_rate)) / 100;
        });

        const totalAmount = subtotal + vatAmount;

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        // Create order
        const orderResult = await client.query(
          `INSERT INTO orders (
            order_number, user_id, subtotal, vat_amount, total_amount,
            billing_email, billing_first_name, billing_last_name, billing_company,
            billing_vat_number, billing_address, billing_city, billing_postal_code,
            billing_country, payment_method, status, payment_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending', 'pending')
          RETURNING *`,
          [
            orderNumber, req.user.id, subtotal, vatAmount, totalAmount,
            billingData.billingEmail, billingData.billingFirstName, billingData.billingLastName,
            billingData.billingCompany, billingData.billingVatNumber, billingData.billingAddress,
            billingData.billingCity, billingData.billingPostalCode, billingData.billingCountry,
            billingData.paymentMethod
          ]
        );

        const order = orderResult.rows[0];

        // Create order items
        for (const item of cartResult.rows) {
          const itemSubtotal = parseFloat(item.price) * item.quantity;

          await client.query(
            `INSERT INTO order_items (
              order_id, product_id, product_name, product_sku, quantity,
              unit_price, vat_rate, subtotal
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              order.id, item.product_id, item.name_it, item.sku,
              item.quantity, item.price, item.vat_rate, itemSubtotal
            ]
          );
        }

        // Clear cart
        await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

        return order;
      });

      res.status(201).json({
        success: true,
        data: {
          order: {
            id: order.id,
            orderNumber: order.order_number,
            totalAmount: order.total_amount,
            currency: order.currency,
            paymentMethod: order.payment_method,
            status: order.status
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/ecommerce/orders
 * Get user's orders
 */
router.get('/orders', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
        id, order_number, status, payment_status,
        total_amount, currency, created_at
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        orders: result.rows
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ecommerce/orders/:orderId
 * Get single order details
 */
router.get('/orders/:orderId', authenticate, async (req, res, next) => {
  try {
    const orderResult = await query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [req.params.orderId, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' }
      });
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [order.id]
    );

    res.json({
      success: true,
      data: {
        order: {
          ...order,
          items: itemsResult.rows
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
