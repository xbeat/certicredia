import { pool } from '../../../core/database/connection.js';
import { auditLog } from '../../audit/services/auditService.js';
import logger from '../../../core/utils/logger.js';

/**
 * Organization Service
 * Manages organizations (Enti Pubblici, Aziende Private)
 */

/**
 * Create new organization
 */
export const createOrganization = async (organizationData, createdBy = null) => {
  const client = await pool.connect();

  try {
    const {
      name,
      organizationType,
      vatNumber,
      fiscalCode,
      address,
      city,
      postalCode,
      country,
      phone,
      email,
      pec,
      website,
      billingAddress,
      billingCity,
      billingPostalCode,
      billingCountry
    } = organizationData;

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO organizations (
        name, organization_type, vat_number, fiscal_code,
        address, city, postal_code, country,
        phone, email, pec, website,
        billing_address, billing_city, billing_postal_code, billing_country,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'pending')
      RETURNING *`,
      [
        name, organizationType, vatNumber, fiscalCode,
        address, city, postalCode, country || 'Italia',
        phone, email, pec, website,
        billingAddress || address,
        billingCity || city,
        billingPostalCode || postalCode,
        billingCountry || country || 'Italia'
      ]
    );

    const organization = result.rows[0];

    // If created by a user, add them as admin
    if (createdBy) {
      await client.query(
        `INSERT INTO organization_users (organization_id, user_id, role, created_by)
         VALUES ($1, $2, 'admin', $2)`,
        [organization.id, createdBy]
      );
    }

    await client.query('COMMIT');

    logger.success(`✅ Organizzazione creata: ${name} (ID: ${organization.id})`);

    // Audit log
    if (createdBy) {
      await auditLog({
        userId: createdBy,
        organizationId: organization.id,
        action: 'ORGANIZATION_CREATED',
        entityType: 'organization',
        entityId: organization.id,
        newValue: organization
      });
    }

    return organization;

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore creazione organizzazione:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get organization by ID
 */
export const getOrganizationById = async (organizationId) => {
  try {
    const result = await pool.query(
      'SELECT * FROM organizations WHERE id = $1',
      [organizationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Organizzazione non trovata');
    }

    return result.rows[0];

  } catch (error) {
    logger.error('Errore recupero organizzazione:', error);
    throw error;
  }
};

/**
 * Get all organizations (with pagination)
 */
export const getAllOrganizations = async (filters = {}) => {
  try {
    const {
      status,
      organizationType,
      search,
      limit = 50,
      offset = 0
    } = filters;

    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    if (status) {
      whereConditions.push(`status = $${paramCount++}`);
      params.push(status);
    }

    if (organizationType) {
      whereConditions.push(`organization_type = $${paramCount++}`);
      params.push(organizationType);
    }

    if (search) {
      whereConditions.push(`(name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR vat_number ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const query = `
      SELECT * FROM organizations
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Count total
    const countQuery = `SELECT COUNT(*) FROM organizations ${whereClause}`;
    const countResult = await pool.query(countQuery, params.slice(0, params.length - 2));
    const total = parseInt(countResult.rows[0].count);

    return {
      organizations: result.rows,
      total,
      limit,
      offset,
      hasMore: total > (offset + limit)
    };

  } catch (error) {
    logger.error('Errore recupero organizzazioni:', error);
    throw error;
  }
};

/**
 * Update organization
 */
export const updateOrganization = async (organizationId, updates, updatedBy = null) => {
  const client = await pool.connect();

  try {
    // Get old value for audit
    const oldValueResult = await client.query(
      'SELECT * FROM organizations WHERE id = $1',
      [organizationId]
    );

    if (oldValueResult.rows.length === 0) {
      throw new Error('Organizzazione non trovata');
    }

    const oldValue = oldValueResult.rows[0];

    await client.query('BEGIN');

    // Build update query dynamically
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'name', 'organization_type', 'vat_number', 'fiscal_code',
      'address', 'city', 'postal_code', 'country',
      'phone', 'email', 'pec', 'website',
      'billing_address', 'billing_city', 'billing_postal_code', 'billing_country'
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        fields.push(`${field} = $${paramCount++}`);
        values.push(updates[field]);
      }
    }

    if (fields.length === 0) {
      throw new Error('Nessun campo da aggiornare');
    }

    values.push(organizationId);

    const updateQuery = `
      UPDATE organizations
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await client.query(updateQuery, values);

    await client.query('COMMIT');

    const updated = result.rows[0];

    logger.info(`✅ Organizzazione aggiornata: ${updated.name} (ID: ${organizationId})`);

    // Audit log
    if (updatedBy) {
      await auditLog({
        userId: updatedBy,
        organizationId,
        action: 'ORGANIZATION_UPDATED',
        entityType: 'organization',
        entityId: organizationId,
        oldValue,
        newValue: updated
      });
    }

    return updated;

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore aggiornamento organizzazione:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Change organization status
 */
export const changeOrganizationStatus = async (organizationId, newStatus, changedBy = null) => {
  const client = await pool.connect();

  try {
    const oldValueResult = await client.query(
      'SELECT status FROM organizations WHERE id = $1',
      [organizationId]
    );

    if (oldValueResult.rows.length === 0) {
      throw new Error('Organizzazione non trovata');
    }

    const oldStatus = oldValueResult.rows[0].status;

    await client.query(
      `UPDATE organizations
       SET status = $1, updated_at = CURRENT_TIMESTAMP,
           verified_at = CASE WHEN $1 = 'active' THEN CURRENT_TIMESTAMP ELSE verified_at END
       WHERE id = $2`,
      [newStatus, organizationId]
    );

    logger.info(`✅ Status organizzazione #${organizationId}: ${oldStatus} → ${newStatus}`);

    // Audit log
    if (changedBy) {
      await auditLog({
        userId: changedBy,
        organizationId,
        action: 'ORGANIZATION_STATUS_CHANGED',
        entityType: 'organization',
        entityId: organizationId,
        oldValue: { status: oldStatus },
        newValue: { status: newStatus }
      });
    }

    return { success: true, oldStatus, newStatus };

  } catch (error) {
    logger.error('Errore cambio status organizzazione:', error);
    throw error;
  }
};

/**
 * Add user to organization
 */
export const addUserToOrganization = async (organizationId, userId, role, addedBy) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if already exists
    const existing = await client.query(
      'SELECT id FROM organization_users WHERE organization_id = $1 AND user_id = $2',
      [organizationId, userId]
    );

    if (existing.rows.length > 0) {
      throw new Error('Utente già associato a questa organizzazione');
    }

    await client.query(
      `INSERT INTO organization_users (organization_id, user_id, role, created_by)
       VALUES ($1, $2, $3, $4)`,
      [organizationId, userId, role, addedBy]
    );

    await client.query('COMMIT');

    logger.success(`✅ Utente #${userId} aggiunto a organizzazione #${organizationId} come ${role}`);

    // Audit log
    await auditLog({
      userId: addedBy,
      organizationId,
      action: 'ORGANIZATION_USER_ADDED',
      entityType: 'organization_user',
      newValue: { organizationId, userId, role }
    });

    return { success: true };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore aggiunta utente a organizzazione:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get organization users
 */
export const getOrganizationUsers = async (organizationId) => {
  try {
    const result = await pool.query(
      `SELECT
        ou.id, ou.role, ou.created_at,
        u.id as user_id, u.email, u.name, u.phone, u.active
       FROM organization_users ou
       JOIN users u ON ou.user_id = u.id
       WHERE ou.organization_id = $1
       ORDER BY ou.created_at ASC`,
      [organizationId]
    );

    return result.rows;

  } catch (error) {
    logger.error('Errore recupero utenti organizzazione:', error);
    throw error;
  }
};

/**
 * Remove user from organization
 */
export const removeUserFromOrganization = async (organizationId, userId, removedBy) => {
  try {
    const result = await pool.query(
      'DELETE FROM organization_users WHERE organization_id = $1 AND user_id = $2',
      [organizationId, userId]
    );

    if (result.rowCount === 0) {
      throw new Error('Associazione utente-organizzazione non trovata');
    }

    logger.info(`✅ Utente #${userId} rimosso da organizzazione #${organizationId}`);

    // Audit log
    await auditLog({
      userId: removedBy,
      organizationId,
      action: 'ORGANIZATION_USER_REMOVED',
      entityType: 'organization_user',
      oldValue: { organizationId, userId }
    });

    return { success: true };

  } catch (error) {
    logger.error('Errore rimozione utente da organizzazione:', error);
    throw error;
  }
};

export default {
  createOrganization,
  getOrganizationById,
  getAllOrganizations,
  updateOrganization,
  changeOrganizationStatus,
  addUserToOrganization,
  getOrganizationUsers,
  removeUserFromOrganization
};
