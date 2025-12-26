import cron from 'node-cron';
import { pool } from '../database/connection.js';
import { cleanExpiredTokens } from '../../modules/auth/services/passwordService.js';
import { cleanOldAuditLogs } from '../../modules/audit/services/auditService.js';
import logger from './logger.js';

/**
 * Cron Jobs Manager
 * Scheduled tasks for maintenance and compliance
 */

/**
 * Clean expired password reset tokens
 * Runs daily at 2 AM
 */
const cleanTokensJob = cron.schedule(
  process.env.CRON_TOKEN_CLEANUP_SCHEDULE || '0 2 * * *',
  async () => {
    try {
      logger.info('🕐 Cron: Pulizia token scaduti...');
      await cleanExpiredTokens();
    } catch (error) {
      logger.error('❌ Errore cron cleanup token:', error);
    }
  },
  { scheduled: false }
);

/**
 * Check specialist CPE compliance
 * Runs annually on January 1st
 */
const cpeComplianceJob = cron.schedule(
  process.env.CRON_CPE_CHECK_SCHEDULE || '0 0 1 1 *',
  async () => {
    try {
      logger.info('🕐 Cron: Verifica compliance CPE annuale...');

      const result = await pool.query(
        `UPDATE specialist_profiles
         SET status = 'suspended',
             cpe_compliant = false,
             suspended_at = CURRENT_TIMESTAMP
         WHERE cpe_hours_current_year < $1
           AND status = 'active'`,
        [parseInt(process.env.SPECIALIST_CPE_ANNUAL_HOURS) || 40]
      );

      logger.warn(`⚠️  ${result.rowCount} specialist sospesi per mancanza requisiti CPE`);

      // Reset annual CPE hours
      await pool.query(
        'UPDATE specialist_profiles SET cpe_hours_current_year = 0, cpe_last_check_date = CURRENT_DATE'
      );

      logger.info('✅ Ore CPE annuali resettate');

    } catch (error) {
      logger.error('❌ Errore cron CPE compliance:', error);
    }
  },
  { scheduled: false }
);

/**
 * Send accreditation expiry notifications
 * Runs daily at 9 AM
 */
const expiryNotificationsJob = cron.schedule(
  process.env.CRON_ACCREDITATION_NOTIFICATIONS_SCHEDULE || '0 9 * * *',
  async () => {
    try {
      logger.info('🕐 Cron: Invio notifiche scadenza accreditamenti...');

      const notificationDays = (process.env.ACCREDITATION_NOTIFICATION_DAYS || '30,15,7').split(',').map(d => parseInt(d));

      for (const days of notificationDays) {
        const result = await pool.query(
          `SELECT
            a.id, a.expires_at,
            o.name as org_name, o.email as org_email
           FROM assessments a
           JOIN organizations o ON a.organization_id = o.id
           WHERE a.status = 'approved'
             AND a.expires_at::date = CURRENT_DATE + INTERVAL '${days} days'`,
        );

        if (result.rows.length > 0) {
          logger.info(`📧 ${result.rows.length} notifiche da inviare per scadenza in ${days} giorni`);

          // TODO: Send emails (integrate with email service)
          for (const assessment of result.rows) {
            logger.info(`  → ${assessment.org_name} (scade: ${assessment.expires_at})`);
          }
        }
      }

      logger.success('✅ Notifiche scadenza elaborate');

    } catch (error) {
      logger.error('❌ Errore cron notifiche scadenza:', error);
    }
  },
  { scheduled: false }
);

/**
 * Clean old audit logs (if retention policy is set)
 * Runs daily at 3 AM
 */
const cleanAuditLogsJob = cron.schedule(
  '0 3 * * *',
  async () => {
    try {
      if (process.env.AUDIT_RETENTION_DAYS && process.env.AUDIT_RETENTION_DAYS !== '0') {
        logger.info('🕐 Cron: Pulizia audit logs vecchi...');
        await cleanOldAuditLogs();
      }
    } catch (error) {
      logger.error('❌ Errore cron cleanup audit logs:', error);
    }
  },
  { scheduled: false }
);

/**
 * Start all cron jobs
 */
export const startCronJobs = () => {
  if (process.env.CRON_ENABLED !== 'true') {
    logger.info('ℹ️  Cron jobs disabilitati (CRON_ENABLED=false)');
    return;
  }

  cleanTokensJob.start();
  cpeComplianceJob.start();
  expiryNotificationsJob.start();
  cleanAuditLogsJob.start();

  logger.success('✅ Cron jobs avviati');
  logger.info('  → Token cleanup: Daily at 2 AM');
  logger.info('  → CPE compliance: Annually on Jan 1st');
  logger.info('  → Expiry notifications: Daily at 9 AM');
  logger.info('  → Audit cleanup: Daily at 3 AM');
};

/**
 * Stop all cron jobs
 */
export const stopCronJobs = () => {
  cleanTokensJob.stop();
  cpeComplianceJob.stop();
  expiryNotificationsJob.stop();
  cleanAuditLogsJob.stop();

  logger.info('⏸️  Cron jobs fermati');
};

export default {
  startCronJobs,
  stopCronJobs
};
