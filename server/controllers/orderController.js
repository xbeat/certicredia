import { pool } from '../config/database.js';
import { sendOrderConfirmation, sendOrderNotificationToAdmin } from '../config/email.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `CC-${timestamp}-${random}`;
};

/**
 * Create order from cart
 */
export const createOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      billing_name,
      billing_email,
      billing_phone,
      billing_address,
      billing_city,
      billing_postal_code,
      billing_country,
      billing_vat,
      payment_method = 'bank_transfer',
      notes
    } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Devi essere autenticato per effettuare un ordine'
      });
    }

    await client.query('BEGIN');

    // Get cart items
    const cartResult = await client.query(
      `SELECT c.*, p.name, p.price, p.slug
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1 AND p.active = true`,
      [req.user.id]
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Carrello vuoto'
      });
    }

    // Calculate total
    const subtotalAmount = cartResult.rows.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);

    const taxAmount = subtotalAmount * 0.22; // IVA 22%
    const totalAmount = subtotalAmount + taxAmount;

    // Create order
    const orderNumber = generateOrderNumber();

    const orderResult = await client.query(
      `INSERT INTO orders (
        user_id, order_number, status, subtotal_amount, tax_amount, total_amount,
        payment_method, payment_status,
        billing_name, billing_email, billing_phone,
        billing_address, billing_city, billing_postal_code, billing_country, billing_vat,
        customer_notes
      )
      VALUES ($1, $2, 'pending', $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        req.user.id, orderNumber, subtotalAmount, taxAmount, totalAmount, payment_method,
        billing_name, billing_email, billing_phone,
        billing_address, billing_city, billing_postal_code, billing_country || 'Italia', billing_vat,
        notes
      ]
    );

    const order = orderResult.rows[0];

    // Create order items
    for (const item of cartResult.rows) {
      await client.query(
        `INSERT INTO order_items (
          order_id, product_id, product_name, product_slug,
          quantity, unit_price, total_price
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          order.id,
          item.product_id,
          item.name,
          item.slug,
          item.quantity,
          item.price,
          parseFloat(item.price) * item.quantity
        ]
      );
    }

    // Clear cart
    await client.query(
      'DELETE FROM cart_items WHERE user_id = $1',
      [req.user.id]
    );

    await client.query('COMMIT');

    logger.info(`✅ Ordine creato: ${orderNumber} per ${req.user.email}`);

    // Send email notifications (non-blocking)
    const emailData = { order, items: cartResult.rows, user: req.user };
    Promise.all([
      sendOrderConfirmation(emailData).catch(err => logger.error('Email conferma fallita:', err)),
      sendOrderNotificationToAdmin(emailData).catch(err => logger.error('Email notifica admin fallita:', err))
    ]);

    res.status(201).json({
      success: true,
      message: 'Ordine creato con successo',
      data: {
        order: order,
        orderNumber: order.order_number
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore creazione ordine:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante la creazione dell\'ordine'
    });
  } finally {
    client.release();
  }
};

/**
 * Get user orders
 */
export const getUserOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticazione richiesta'
      });
    }

    const result = await pool.query(
      `SELECT id, order_number, status, total_amount,
              payment_method, payment_status, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    logger.error('Errore recupero ordini:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero degli ordini'
    });
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Admin can see all orders, users can only see their own
    const query = req.user.role === 'admin'
      ? 'SELECT * FROM orders WHERE id = $1'
      : 'SELECT * FROM orders WHERE id = $1 AND user_id = $2';

    const params = req.user.role === 'admin' ? [id] : [id, req.user.id];

    const orderResult = await pool.query(query, params);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ordine non trovato'
      });
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...order,
        items: itemsResult.rows
      }
    });

  } catch (error) {
    logger.error('Errore recupero ordine:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero dell\'ordine'
    });
  }
};

/**
 * Get all orders (admin)
 */
export const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Build count query
    let countQuery = 'SELECT COUNT(*) FROM orders WHERE 1=1';
    const countParams = [];
    if (status) {
      countQuery += ' AND status = $1';
      countParams.push(status);
    }

    // Get total count
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Build data query
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Errore recupero ordini (admin):', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero degli ordini'
    });
  }
};

/**
 * Update order status (admin)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status } = req.body;

    const result = await pool.query(
      `UPDATE orders
       SET status = COALESCE($1, status),
           payment_status = COALESCE($2, payment_status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, payment_status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ordine non trovato'
      });
    }

    logger.info(`✅ Stato ordine aggiornato: ${result.rows[0].order_number}`);

    res.json({
      success: true,
      message: 'Ordine aggiornato con successo',
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Errore aggiornamento ordine:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante l\'aggiornamento dell\'ordine'
    });
  }
};

/**
 * Create Stripe payment intent (for future use)
 */
export const createPaymentIntent = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Pagamento con carta non disponibile al momento'
      });
    }

    const { order_id } = req.body;

    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [order_id, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ordine non trovato'
      });
    }

    const order = orderResult.rows[0];

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(order.total_amount) * 100),
      currency: 'eur',
      metadata: {
        order_id: order.id,
        order_number: order.order_number
      }
    });

    await pool.query(
      'UPDATE orders SET payment_intent_id = $1 WHERE id = $2',
      [paymentIntent.id, order.id]
    );

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    logger.error('Errore creazione payment intent:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante la creazione del pagamento'
    });
  }
};
