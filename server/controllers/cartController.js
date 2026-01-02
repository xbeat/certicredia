import { pool } from '../config/database.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get user's cart
 */
export const getCart = async (req, res) => {
  try {
    let query;
    let params;

    // If user is authenticated, use user_id, otherwise use session_id
    if (req.user) {
      query = `
        SELECT c.*, p.name, p.slug, p.price, p.short_description,
               (c.quantity * p.price) as total_price
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = $1 AND p.active = true
      `;
      params = [req.user.id];
    } else {
      // For guest users, use session_id from cookie or create new one
      let sessionId = req.cookies.cart_session_id;

      if (!sessionId) {
        sessionId = uuidv4();
        res.cookie('cart_session_id', sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
      }

      query = `
        SELECT c.*, p.name, p.slug, p.price, p.short_description,
               (c.quantity * p.price) as total_price
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE c.session_id = $1 AND p.active = true
      `;
      params = [sessionId];
    }

    const result = await pool.query(query, params);

    const totalAmount = result.rows.reduce((sum, item) => {
      return sum + parseFloat(item.total_price);
    }, 0);

    res.json({
      success: true,
      count: result.rows.length,
      totalAmount: totalAmount.toFixed(0),
      data: result.rows
    });

  } catch (error) {
    logger.error('Errore recupero carrello:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero del carrello'
    });
  }
};

/**
 * Add item to cart
 */
export const addToCart = async (req, res) => {
  const client = await pool.connect();

  try {
    const { product_id, quantity = 1 } = req.body;

    // Check if product exists and is active
    const productResult = await client.query(
      'SELECT id, name, price FROM products WHERE id = $1 AND active = true',
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prodotto non trovato'
      });
    }

    const product = productResult.rows[0];

    await client.query('BEGIN');

    let result;

    if (req.user) {
      // For authenticated users - try ON CONFLICT first, fallback if index doesn't exist
      try {
        result = await client.query(
          `INSERT INTO cart_items (user_id, product_id, quantity)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, product_id)
           DO UPDATE SET quantity = cart_items.quantity + $3, updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [req.user.id, product_id, quantity]
        );
      } catch (conflictError) {
        if (conflictError.code === '42P10') {
          // No matching constraint - rollback and use manual upsert
          await client.query('ROLLBACK');
          await client.query('BEGIN');

          const existing = await client.query(
            'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
            [req.user.id, product_id]
          );

          if (existing.rows.length > 0) {
            result = await client.query(
              `UPDATE cart_items SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
               WHERE user_id = $2 AND product_id = $3 RETURNING *`,
              [quantity, req.user.id, product_id]
            );
          } else {
            result = await client.query(
              'INSERT INTO cart_items(user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
              [req.user.id, product_id, quantity]
            );
          }
        } else {
          throw conflictError;
        }
      }
    } else {
      // For guest users - try ON CONFLICT first, fallback if index doesn't exist
      let sessionId = req.cookies.cart_session_id || uuidv4();

      if (!req.cookies.cart_session_id) {
        res.cookie('cart_session_id', sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000
        });
      }

      try {
        result = await client.query(
          `INSERT INTO cart_items(session_id, product_id, quantity)
           VALUES ($1, $2, $3)
           ON CONFLICT (session_id, product_id)
           DO UPDATE SET quantity = cart_items.quantity + $3, updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [sessionId, product_id, quantity]
        );
      } catch (conflictError) {
        if (conflictError.code === '42P10') {
          // No matching constraint - rollback and use manual upsert
          await client.query('ROLLBACK');
          await client.query('BEGIN');

          const existing = await client.query(
            'SELECT id, quantity FROM cart_items WHERE session_id = $1 AND product_id = $2',
            [sessionId, product_id]
          );

          if (existing.rows.length > 0) {
            result = await client.query(
              `UPDATE cart_items SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
               WHERE session_id = $2 AND product_id = $3 RETURNING *`,
              [quantity, sessionId, product_id]
            );
          } else {
            result = await client.query(
              'INSERT INTO cart_items(session_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
              [sessionId, product_id, quantity]
            );
          }
        } else {
          throw conflictError;
        }
      }
    }

    await client.query('COMMIT');

    logger.info(`✅ Prodotto aggiunto al carrello: ${product.name}`);

    res.status(201).json({
      success: true,
      message: 'Prodotto aggiunto al carrello',
      data: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore aggiunta al carrello:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante l\'aggiunta al carrello'
    });
  } finally {
    client.release();
  }
};

/**
 * Update cart item quantity
 */
export const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'La quantità deve essere almeno 1'
      });
    }

    let query;
    let params;

    if (req.user) {
      query = `
        UPDATE cart_items
        SET quantity = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3
        RETURNING *
      `;
      params = [quantity, id, req.user.id];
    } else {
      const sessionId = req.cookies.cart_session_id;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Carrello non trovato'
        });
      }

      query = `
        UPDATE cart_items
        SET quantity = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND session_id = $3
        RETURNING *
      `;
      params = [quantity, id, sessionId];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Articolo non trovato nel carrello'
      });
    }

    res.json({
      success: true,
      message: 'Quantità aggiornata',
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Errore aggiornamento carrello:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante l\'aggiornamento del carrello'
    });
  }
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;

    let query;
    let params;

    if (req.user) {
      query = 'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING *';
      params = [id, req.user.id];
    } else {
      const sessionId = req.cookies.cart_session_id;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Carrello non trovato'
        });
      }

      query = 'DELETE FROM cart_items WHERE id = $1 AND session_id = $2 RETURNING *';
      params = [id, sessionId];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Articolo non trovato nel carrello'
      });
    }

    res.json({
      success: true,
      message: 'Articolo rimosso dal carrello'
    });

  } catch (error) {
    logger.error('Errore rimozione dal carrello:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante la rimozione dal carrello'
    });
  }
};

/**
 * Clear entire cart
 */
export const clearCart = async (req, res) => {
  try {
    let query;
    let params;

    if (req.user) {
      query = 'DELETE FROM cart_items WHERE user_id = $1';
      params = [req.user.id];
    } else {
      const sessionId = req.cookies.cart_session_id;

      if (!sessionId) {
        return res.json({
          success: true,
          message: 'Carrello già vuoto'
        });
      }

      query = 'DELETE FROM cart_items WHERE session_id = $1';
      params = [sessionId];
    }

    await pool.query(query, params);

    res.json({
      success: true,
      message: 'Carrello svuotato'
    });

  } catch (error) {
    logger.error('Errore svuotamento carrello:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante lo svuotamento del carrello'
    });
  }
};

/**
 * Merge guest cart with user cart after login
 */
export const mergeCart = async (req, res) => {
  const client = await pool.connect();

  try {
    const sessionId = req.cookies.cart_session_id;

    if (!sessionId || !req.user) {
      return res.json({
        success: true,
        message: 'Nessun carrello da unire'
      });
    }

    await client.query('BEGIN');

    // Get items from guest cart
    const guestCartResult = await client.query(
      'SELECT product_id, quantity FROM cart_items WHERE session_id = $1',
      [sessionId]
    );

    // Merge each item into user cart
    for (const item of guestCartResult.rows) {
      await client.query(
        `INSERT INTO cart_items(user_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, product_id)
         DO UPDATE SET quantity = cart_items.quantity + $3, updated_at = CURRENT_TIMESTAMP`,
        [req.user.id, item.product_id, item.quantity]
      );
    }

    // Delete guest cart
    await client.query(
      'DELETE FROM cart_items WHERE session_id = $1',
      [sessionId]
    );

    // Clear session cookie
    res.clearCookie('cart_session_id');

    await client.query('COMMIT');

    logger.info(`✅ Carrello unito per utente: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Carrello unito con successo'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore unione carrello:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante l\'unione del carrello'
    });
  } finally {
    client.release();
  }
};
