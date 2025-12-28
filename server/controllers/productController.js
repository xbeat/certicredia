import { pool } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get all active products
 */
export const getAllProducts = async (req, res) => {
  try {
    const { category } = req.query;

    let query = 'SELECT * FROM products WHERE active = true';
    const params = [];

    if (category) {
      query += ' AND category = $1';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    logger.error('Errore recupero prodotti:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero dei prodotti'
    });
  }
};

/**
 * Get product by slug
 */
export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      'SELECT * FROM products WHERE slug = $1 AND active = true',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prodotto non trovato'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Errore recupero prodotto:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero del prodotto'
    });
  }
};

/**
 * Create product (admin only)
 */
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      short_description,
      price,
      category,
      duration_months,
      metadata
    } = req.body;

    const result = await pool.query(
      `INSERT INTO products (
        name, slug, description, short_description, price, category,
        duration_months, metadata, active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *`,
      [
        name,
        slug,
        description,
        short_description,
        price,
        category,
        duration_months || null,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    logger.info(`✅ Prodotto creato: ${name}`);

    res.status(201).json({
      success: true,
      message: 'Prodotto creato con successo',
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Errore creazione prodotto:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Uno prodotto con questo slug esiste già'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Errore durante la creazione del prodotto'
    });
  }
};

/**
 * Update product (admin only)
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      short_description,
      price,
      category,
      duration_months,
      metadata,
      active
    } = req.body;

    const result = await pool.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           short_description = COALESCE($4, short_description),
           price = COALESCE($5, price),
           category = COALESCE($6, category),
           duration_months = COALESCE($7, duration_months),
           metadata = COALESCE($8, metadata),
           active = COALESCE($9, active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [
        name,
        slug,
        description,
        short_description,
        price,
        category,
        duration_months,
        metadata ? JSON.stringify(metadata) : undefined,
        active,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prodotto non trovato'
      });
    }

    logger.info(`✅ Prodotto aggiornato: ${result.rows[0].name}`);

    res.json({
      success: true,
      message: 'Prodotto aggiornato con successo',
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Errore aggiornamento prodotto:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante l\'aggiornamento del prodotto'
    });
  }
};

/**
 * Delete product (admin only)
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete: just mark as inactive
    const result = await pool.query(
      'UPDATE products SET active = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prodotto non trovato'
      });
    }

    logger.info(`✅ Prodotto eliminato: ${result.rows[0].name}`);

    res.json({
      success: true,
      message: 'Prodotto eliminato con successo'
    });

  } catch (error) {
    logger.error('Errore eliminazione prodotto:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante l\'eliminazione del prodotto'
    });
  }
};

/**
 * Get all products (admin - including inactive)
 */
export const getAllProductsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) FROM products');
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const result = await pool.query(
      'SELECT * FROM products ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

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
    logger.error('Errore recupero prodotti (admin):', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero dei prodotti'
    });
  }
};
