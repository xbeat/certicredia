import { pool } from '../../../core/database/connection.js';
import { auditLog } from '../../audit/services/auditService.js';
import logger from '../../../core/utils/logger.js';

/**
 * Assessment Template Service
 * Manages versioned assessment frameworks (JSONB structure)
 */

/**
 * Create assessment template
 */
export const createTemplate = async (templateData, createdBy) => {
  const client = await pool.connect();

  try {
    const { version, name, description, structure } = templateData;

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO assessment_templates (version, name, description, structure, status, created_by)
       VALUES ($1, $2, $3, $4, 'draft', $5)
       RETURNING *`,
      [version, name, description, JSON.stringify(structure), createdBy]
    );

    await client.query('COMMIT');

    const template = result.rows[0];

    logger.success(`✅ Assessment template created: ${version} - ${name}`);

    await auditLog({
      userId: createdBy,
      action: 'ASSESSMENT_TEMPLATE_CREATED',
      entityType: 'assessment_template',
      entityId: template.id,
      newValue: template
    });

    return template;

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating template:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Activate template version
 */
export const activateTemplate = async (templateId, activatedBy) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Deactivate all other templates
    await client.query('UPDATE assessment_templates SET active = false');

    // Activate this one
    await client.query(
      `UPDATE assessment_templates
       SET status = 'active', active = true, activated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [templateId]
    );

    await client.query('COMMIT');

    logger.success(`✅ Template #${templateId} activated`);

    await auditLog({
      userId: activatedBy,
      action: 'ASSESSMENT_TEMPLATE_ACTIVATED',
      entityType: 'assessment_template',
      entityId: templateId
    });

    return { success: true };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error activating template:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get active template
 */
export const getActiveTemplate = async () => {
  try {
    const result = await pool.query(
      'SELECT * FROM assessment_templates WHERE active = true LIMIT 1'
    );

    if (result.rows.length === 0) {
      throw new Error('No active template found');
    }

    return result.rows[0];

  } catch (error) {
    logger.error('Error getting active template:', error);
    throw error;
  }
};

/**
 * Get all templates
 */
export const getAllTemplates = async () => {
  try {
    const result = await pool.query(
      'SELECT * FROM assessment_templates ORDER BY created_at DESC'
    );

    return result.rows;

  } catch (error) {
    logger.error('Error getting templates:', error);
    throw error;
  }
};

export default {
  createTemplate,
  activateTemplate,
  getActiveTemplate,
  getAllTemplates
};
