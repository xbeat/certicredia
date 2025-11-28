/**
 * General API Routes
 * Products, Contact forms, etc.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/products
 * Get all active products
 */
router.get('/products', async (req, res, next) => {
  try {
    const { type, featured, lang = 'it' } = req.query;

    let queryText = `
      SELECT
        id,
        sku,
        type,
        CASE WHEN $1 = 'it' THEN name_it ELSE name_en END as name,
        CASE WHEN $1 = 'it' THEN description_it ELSE description_en END as description,
        CASE WHEN $1 = 'it' THEN short_description_it ELSE short_description_en END as short_description,
        price,
        currency,
        discount_percentage,
        is_featured,
        image_url,
        created_at
      FROM products
      WHERE status = 'active'
    `;

    const params = [lang];
    let paramIndex = 2;

    if (type) {
      queryText += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (featured === 'true') {
      queryText += ` AND is_featured = TRUE`;
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: {
        products: result.rows
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/:id
 * Get single product
 */
router.get('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lang = 'it' } = req.query;

    const result = await query(
      `SELECT
        id,
        sku,
        type,
        CASE WHEN $2 = 'it' THEN name_it ELSE name_en END as name,
        CASE WHEN $2 = 'it' THEN description_it ELSE description_en END as description,
        CASE WHEN $2 = 'it' THEN short_description_it ELSE short_description_en END as short_description,
        price,
        currency,
        vat_rate,
        discount_percentage,
        is_featured,
        image_url,
        gallery_urls,
        metadata,
        created_at
      FROM products
      WHERE id = $1 AND status = 'active'`,
      [id, lang]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product not found' }
      });
    }

    res.json({
      success: true,
      data: {
        product: result.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/contact
 * Submit contact form
 */
router.post('/contact',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('company').optional().trim(),
    body('subject').optional().trim(),
    body('message').trim().notEmpty(),
    body('userType').optional().isIn(['ciso', 'hr', 'assessor'])
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

      const { name, email, company, subject, message, userType } = req.body;

      await query(
        `INSERT INTO contact_submissions (name, email, company, subject, message, user_type)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [name, email, company, subject, message, userType]
      );

      res.status(201).json({
        success: true,
        data: { message: 'Contact form submitted successfully' }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/stats
 * Public statistics (for homepage)
 */
router.get('/stats', async (req, res, next) => {
  try {
    const assessmentsCount = await query('SELECT COUNT(*) FROM assessments WHERE status = \'certified\'');
    const assessorsCount = await query('SELECT COUNT(*) FROM assessors WHERE is_certified = TRUE');
    const companiesCount = await query('SELECT COUNT(DISTINCT company_id) FROM assessments');

    res.json({
      success: true,
      data: {
        certifiedCompanies: parseInt(assessmentsCount.rows[0].count),
        certifiedAssessors: parseInt(assessorsCount.rows[0].count),
        totalAssessments: parseInt(companiesCount.rows[0].count)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
