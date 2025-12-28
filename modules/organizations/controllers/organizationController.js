import {
  createOrganization,
  getOrganizationById,
  getAllOrganizations,
  updateOrganization,
  changeOrganizationStatus,
  addUserToOrganization,
  getOrganizationUsers,
  removeUserFromOrganization,
  getOrganizationByUserId
} from '../services/organizationService.js';
import logger from '../../../server/utils/logger.js';
import bcrypt from 'bcrypt';
import pool from '../../../server/config/database.js';

const SALT_ROUNDS = 10;

/**
 * POST /api/organizations
 * Create new organization
 */
export const createOrganizationHandler = async (req, res) => {
  try {
    const organization = await createOrganization(req.body, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Organizzazione creata con successo',
      data: organization
    });

  } catch (error) {
    logger.error('Errore creazione organizzazione:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Errore durante la creazione dell\'organizzazione'
    });
  }
};

/**
 * GET /api/organizations/:id
 * Get organization by ID
 */
export const getOrganizationHandler = async (req, res) => {
  try {
    const organization = await getOrganizationById(parseInt(req.params.id));

    res.json({
      success: true,
      data: organization
    });

  } catch (error) {
    logger.error('Errore recupero organizzazione:', error);

    const statusCode = error.message.includes('non trovata') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Errore durante il recupero dell\'organizzazione'
    });
  }
};

/**
 * GET /api/organizations
 * Get all organizations (with filters)
 */
export const getAllOrganizationsHandler = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      organizationType: req.query.type,
      search: req.query.search,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const result = await getAllOrganizations(filters);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Errore recupero organizzazioni:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero delle organizzazioni'
    });
  }
};

/**
 * PUT /api/organizations/:id
 * Update organization
 */
export const updateOrganizationHandler = async (req, res) => {
  try {
    const organization = await updateOrganization(
      parseInt(req.params.id),
      req.body,
      req.user.id
    );

    res.json({
      success: true,
      message: 'Organizzazione aggiornata con successo',
      data: organization
    });

  } catch (error) {
    logger.error('Errore aggiornamento organizzazione:', error);

    const statusCode = error.message.includes('non trovata') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Errore durante l\'aggiornamento dell\'organizzazione'
    });
  }
};

/**
 * PATCH /api/organizations/:id/status
 * Change organization status
 */
export const changeStatusHandler = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status obbligatorio'
      });
    }

    const result = await changeOrganizationStatus(
      parseInt(req.params.id),
      status,
      req.user.id
    );

    res.json({
      success: true,
      message: `Status cambiato da ${result.oldStatus} a ${result.newStatus}`,
      data: result
    });

  } catch (error) {
    logger.error('Errore cambio status organizzazione:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Errore durante il cambio status'
    });
  }
};

/**
 * POST /api/organizations/:id/users
 * Add user to organization
 */
export const addUserHandler = async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'User ID e ruolo obbligatori'
      });
    }

    await addUserToOrganization(
      parseInt(req.params.id),
      userId,
      role,
      req.user.id
    );

    res.json({
      success: true,
      message: 'Utente aggiunto all\'organizzazione'
    });

  } catch (error) {
    logger.error('Errore aggiunta utente a organizzazione:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Errore durante l\'aggiunta dell\'utente'
    });
  }
};

/**
 * GET /api/organizations/:id/users
 * Get organization users
 */
export const getOrganizationUsersHandler = async (req, res) => {
  try {
    const users = await getOrganizationUsers(parseInt(req.params.id));

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    logger.error('Errore recupero utenti organizzazione:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero degli utenti'
    });
  }
};

/**
 * DELETE /api/organizations/:id/users/:userId
 * Remove user from organization
 */
export const removeUserHandler = async (req, res) => {
  try {
    await removeUserFromOrganization(
      parseInt(req.params.id),
      parseInt(req.params.userId),
      req.user.id
    );

    res.json({
      success: true,
      message: 'Utente rimosso dall\'organizzazione'
    });

  } catch (error) {
    logger.error('Errore rimozione utente da organizzazione:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Errore durante la rimozione dell\'utente'
    });
  }
};

/**
 * GET /api/organizations/me
 * Get current user's organization
 */
export const getMyOrganizationHandler = async (req, res) => {
  try {
    const organization = await getOrganizationByUserId(req.user.id);

    res.json({
      success: true,
      data: organization
    });

  } catch (error) {
    logger.error('Errore recupero organizzazione utente:', error);

    const statusCode = error.message.includes('Nessuna organizzazione') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Errore durante il recupero dell\'organizzazione'
    });
  }
};

/**
 * POST /api/organizations/register
 * Public registration endpoint for organizations
 * Creates user + organization + association in one transaction
 */
export const registerOrganizationHandler = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      // Organization data
      organizationType,
      organizationName,
      vatNumber,
      fiscalCode,
      address,
      city,
      postalCode,
      email,
      phone,
      // Contact person data
      contactFirstName,
      contactLastName,
      contactEmail,
      contactPhone,
      // Credentials
      password
    } = req.body;

    // Validation
    if (!organizationType || !organizationName || !email || !contactFirstName || !contactLastName || !contactEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Campi obbligatori mancanti'
      });
    }

    await client.query('BEGIN');

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [contactEmail]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Email già registrata'
      });
    }

    // Check if organization email already exists
    const existingOrg = await client.query(
      'SELECT id FROM organizations WHERE email = $1',
      [email]
    );

    if (existingOrg.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Email organizzazione già registrata'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, name, role, active, email_verified)
       VALUES ($1, $2, $3, 'organization_admin', true, false)
       RETURNING id`,
      [contactEmail, passwordHash, `${contactFirstName} ${contactLastName}`]
    );

    const userId = userResult.rows[0].id;

    // Create organization
    const orgResult = await client.query(
      `INSERT INTO organizations (
        name, organization_type, vat_number, fiscal_code,
        address, city, postal_code, country,
        email, phone, status, verified
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Italia', $8, $9, 'pending', false)
      RETURNING id`,
      [
        organizationName,
        organizationType,
        vatNumber || null,
        fiscalCode || null,
        address,
        city,
        postalCode,
        email,
        phone || null
      ]
    );

    const orgId = orgResult.rows[0].id;

    // Associate user with organization
    await client.query(
      `INSERT INTO organization_users (organization_id, user_id, role)
       VALUES ($1, $2, 'admin')`,
      [orgId, userId]
    );

    await client.query('COMMIT');

    logger.info(`Nuova organizzazione registrata: ${organizationName} (ID: ${orgId}, User: ${userId})`);

    res.status(201).json({
      success: true,
      message: 'Registrazione completata! Il tuo account è in attesa di verifica.',
      data: {
        organizationId: orgId,
        userId: userId
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore registrazione organizzazione:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Errore durante la registrazione'
    });
  } finally {
    client.release();
  }
};
