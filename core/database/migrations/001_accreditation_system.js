import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool } from '../connection.js';
import logger from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Migration 001: Accreditation System Tables
 * Adds all tables needed for the cybersecurity accreditation platform
 */

export const up = async () => {
  const client = await pool.connect();

  try {
    logger.info('🔄 Starting migration 001_accreditation_system...');

    await client.query('BEGIN');

    // Read and execute the SQL schema file
    const schemaPath = join(__dirname, '../schema/accreditation_schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');

    // Execute the entire schema
    await client.query(schemaSql);

    await client.query('COMMIT');

    logger.success('✅ Migration 001_accreditation_system completed successfully');
    logger.info('📊 Created tables:');
    logger.info('   • password_reset_tokens');
    logger.info('   • mfa_secrets');
    logger.info('   • organizations');
    logger.info('   • organization_users');
    logger.info('   • specialist_profiles');
    logger.info('   • specialist_exam_questions');
    logger.info('   • specialist_exam_attempts');
    logger.info('   • specialist_cpe_records');
    logger.info('   • assessment_templates');
    logger.info('   • assessments');
    logger.info('   • evidence_files');
    logger.info('   • specialist_assignments');
    logger.info('   • review_comments');
    logger.info('   • audit_logs');

    return { success: true };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Migration 001_accreditation_system failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const down = async () => {
  const client = await pool.connect();

  try {
    logger.warn('⚠️  Running ROLLBACK migration 001_accreditation_system...');

    await client.query('BEGIN');

    // Drop tables in reverse order (respecting foreign keys)
    const dropStatements = [
      'DROP TABLE IF EXISTS audit_logs CASCADE',
      'DROP TABLE IF EXISTS review_comments CASCADE',
      'DROP TABLE IF EXISTS specialist_assignments CASCADE',
      'DROP TABLE IF EXISTS evidence_files CASCADE',
      'DROP TABLE IF EXISTS assessments CASCADE',
      'DROP TABLE IF EXISTS assessment_templates CASCADE',
      'DROP TABLE IF EXISTS specialist_cpe_records CASCADE',
      'DROP TABLE IF EXISTS specialist_exam_attempts CASCADE',
      'DROP TABLE IF EXISTS specialist_exam_questions CASCADE',
      'DROP TABLE IF EXISTS specialist_profiles CASCADE',
      'DROP TABLE IF EXISTS organization_users CASCADE',
      'DROP TABLE IF EXISTS organizations CASCADE',
      'DROP TABLE IF EXISTS mfa_secrets CASCADE',
      'DROP TABLE IF EXISTS password_reset_tokens CASCADE',
      'DROP FUNCTION IF EXISTS update_updated_at_column CASCADE'
    ];

    for (const statement of dropStatements) {
      await client.query(statement);
    }

    await client.query('COMMIT');

    logger.success('✅ Migration 001_accreditation_system rolled back successfully');

    return { success: true };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2] || 'up';

  if (command === 'up') {
    up()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else if (command === 'down') {
    down()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    console.error('Usage: node 001_accreditation_system.js [up|down]');
    process.exit(1);
  }
}
