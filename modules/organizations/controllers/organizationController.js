import {
  createOrganization,
  getOrganizationById,
  getAllOrganizations,
  updateOrganization,
  changeOrganizationStatus,
  addUserToOrganization,
  getOrganizationUsers,
  removeUserFromOrganization
} from '../services/organizationService.js';
import logger from '../../../server/utils/logger.js';

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
