import { pool } from '../config/database.js';
import { sendContactNotification, sendAutoResponse } from '../config/email.js';
import logger from '../utils/logger.js';

/**
 * Handle contact form submission
 */
export const submitContact = async (req, res) => {
  const client = await pool.connect();

  try {
    const { userType, name, email, company, linkedin, message } = req.body;

    // Start transaction
    await client.query('BEGIN');

    // Insert contact into database
    const insertQuery = `
      INSERT INTO contacts (user_type, name, email, company, linkedin, message, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'new')
      RETURNING id, created_at
    `;

    const values = [
      userType,
      name,
      email,
      company || null,
      linkedin || null,
      message || null
    ];

    const result = await client.query(insertQuery, values);
    const contactId = result.rows[0].id;
    const createdAt = result.rows[0].created_at;

    logger.info(`📝 Nuovo contatto salvato: ID ${contactId}, Tipo: ${userType}, Email: ${email}`);

    // Commit transaction
    await client.query('COMMIT');

    // Send notification email (non-blocking)
    const emailPromises = [];

    // Send notification to CertiCredia
    emailPromises.push(
      sendContactNotification({
        userType,
        name,
        email,
        company,
        linkedin,
        message
      }).catch(err => {
        logger.error('Errore invio notifica:', err);
        return { success: false, error: err.message };
      })
    );

    // Send auto-response to user
    emailPromises.push(
      sendAutoResponse({
        userType,
        name,
        email
      }).catch(err => {
        logger.error('Errore invio auto-risposta:', err);
        return { success: false, error: err.message };
      })
    );

    // Wait for emails (but don't block the response)
    Promise.all(emailPromises).then(results => {
      const [notificationResult, autoResponseResult] = results;
      logger.info(`Email notification result: ${notificationResult.success ? 'OK' : 'FAILED'}`);
      logger.info(`Auto-response result: ${autoResponseResult.success ? 'OK' : 'FAILED'}`);
    });

    // Return success response immediately
    res.status(201).json({
      success: true,
      message: 'Richiesta ricevuta con successo. Ti contatteremo entro 24 ore.',
      data: {
        id: contactId,
        userType,
        name,
        email,
        createdAt
      }
    });

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');

    logger.error('Errore durante la gestione del contatto:', error);

    // Determine error type and send appropriate response
    if (error.code === '23505') {
      // Duplicate key error (if we add unique constraints)
      return res.status(409).json({
        success: false,
        message: 'Richiesta già inviata con questa email.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante l\'invio della richiesta. Riprova più tardi.'
    });

  } finally {
    client.release();
  }
};

/**
 * Get all contacts (admin endpoint - optional for future use)
 */
export const getAllContacts = async (req, res) => {
  try {
    const { status, userType } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Build count query
    let countQuery = 'SELECT COUNT(*) FROM contacts WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;

    if (status) {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (userType) {
      countQuery += ` AND user_type = $${countParamIndex}`;
      countParams.push(userType);
    }

    // Get total count
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Build data query
    let query = 'SELECT * FROM contacts WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (userType) {
      query += ` AND user_type = $${paramIndex}`;
      params.push(userType);
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
    logger.error('Errore recupero contatti:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero dei contatti'
    });
  }
};

/**
 * Get contact by ID (admin endpoint - optional for future use)
 */
export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM contacts WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contatto non trovato'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Errore recupero contatto:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero del contatto'
    });
  }
};

/**
 * Update contact status (admin endpoint - optional for future use)
 */
export const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE contacts SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contatto non trovato'
      });
    }

    logger.info(`Contatto ${id} aggiornato a stato: ${status}`);

    res.json({
      success: true,
      message: 'Contatto aggiornato con successo',
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Errore aggiornamento contatto:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'aggiornamento del contatto'
    });
  }
};
