import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { pool } from '../../../server/config/database.js';
import logger from '../../../server/utils/logger.js';

/**
 * MFA/TOTP Service
 * Handles Two-Factor Authentication using Time-based One-Time Passwords
 */

/**
 * Check if MFA is required for user's role
 */
export const isMFARequired = (userRole) => {
  const requiredRoles = (process.env.MFA_REQUIRED_ROLES || 'admin,specialist').split(',');
  return requiredRoles.includes(userRole);
};

/**
 * Generate backup codes
 */
const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
};

/**
 * Hash backup code for storage
 */
const hashBackupCode = (code) => {
  return crypto.createHash('sha256').update(code).digest('hex');
};

/**
 * Setup MFA for user
 * Generates secret and QR code
 */
export const setupMFA = async (userId, userEmail) => {
  const client = await pool.connect();

  try {
    // Check if MFA already exists
    const existing = await client.query(
      'SELECT id FROM mfa_secrets WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length > 0) {
      throw new Error('MFA già configurato per questo utente');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${process.env.MFA_APP_NAME || 'CertiCredia'} (${userEmail})`,
      issuer: process.env.MFA_ISSUER || 'CertiCredia Italia',
      length: 32
    });

    // Generate backup codes
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code));

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store secret (but don't enable yet)
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO mfa_secrets (user_id, secret, enabled, backup_codes)
       VALUES ($1, $2, false, $3)`,
      [userId, secret.base32, JSON.stringify(hashedBackupCodes)]
    );

    await client.query('COMMIT');

    logger.info(`✅ MFA setup iniziato per user #${userId}`);

    return {
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      backupCodes, // Return plaintext codes ONLY during setup
      otpauthUrl: secret.otpauth_url
    };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore setup MFA:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Verify TOTP token and enable MFA
 */
export const verifyAndEnableMFA = async (userId, token) => {
  const client = await pool.connect();

  try {
    // Get secret
    const result = await client.query(
      'SELECT secret, enabled FROM mfa_secrets WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('MFA non configurato. Esegui prima il setup.');
    }

    const { secret, enabled } = result.rows[0];

    if (enabled) {
      throw new Error('MFA già abilitato');
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps (±60 seconds)
    });

    if (!verified) {
      throw new Error('Codice non valido');
    }

    // Enable MFA
    await client.query('BEGIN');

    await client.query(
      `UPDATE mfa_secrets
       SET enabled = true, enabled_at = CURRENT_TIMESTAMP
       WHERE user_id = $1`,
      [userId]
    );

    await client.query(
      `UPDATE users
       SET mfa_enabled = true
       WHERE id = $1`,
      [userId]
    );

    await client.query('COMMIT');

    logger.success(`✅ MFA abilitato per user #${userId}`);

    return { success: true };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore verifica MFA:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Verify TOTP token during login
 */
export const verifyMFAToken = async (userId, token) => {
  try {
    // Get secret
    const result = await pool.query(
      'SELECT secret, enabled, backup_codes FROM mfa_secrets WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].enabled) {
      throw new Error('MFA non abilitato');
    }

    const { secret, backup_codes } = result.rows[0];

    // Try TOTP verification first
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (verified) {
      // Update last used
      await pool.query(
        'UPDATE mfa_secrets SET last_used_at = CURRENT_TIMESTAMP WHERE user_id = $1',
        [userId]
      );

      return { success: true, method: 'totp' };
    }

    // Try backup codes if TOTP failed
    const hashedToken = hashBackupCode(token);
    const backupCodesArray = JSON.parse(backup_codes || '[]');

    const backupIndex = backupCodesArray.indexOf(hashedToken);

    if (backupIndex !== -1) {
      // Valid backup code - remove it after use
      backupCodesArray.splice(backupIndex, 1);

      await pool.query(
        `UPDATE mfa_secrets
         SET backup_codes = $1, last_used_at = CURRENT_TIMESTAMP
         WHERE user_id = $2`,
        [JSON.stringify(backupCodesArray), userId]
      );

      logger.warn(`⚠️  Backup code usato per user #${userId}. Rimasti: ${backupCodesArray.length}`);

      return {
        success: true,
        method: 'backup_code',
        remainingBackupCodes: backupCodesArray.length
      };
    }

    // Both methods failed
    throw new Error('Codice non valido');

  } catch (error) {
    logger.error('Errore verifica MFA token:', error);
    throw error;
  }
};

/**
 * Disable MFA for user
 */
export const disableMFA = async (userId, password) => {
  const client = await pool.connect();

  try {
    // Verify password first (security measure)
    const userResult = await client.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Utente non trovato');
    }

    // Password verification should be done by caller
    // This is just a placeholder

    await client.query('BEGIN');

    // Disable MFA
    await client.query(
      'DELETE FROM mfa_secrets WHERE user_id = $1',
      [userId]
    );

    await client.query(
      'UPDATE users SET mfa_enabled = false WHERE id = $1',
      [userId]
    );

    await client.query('COMMIT');

    logger.warn(`⚠️  MFA disabilitato per user #${userId}`);

    return { success: true };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore disabilitazione MFA:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get MFA status for user
 */
export const getMFAStatus = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT
        ms.enabled,
        ms.enabled_at,
        ms.last_used_at,
        u.mfa_enabled as user_mfa_enabled,
        u.mfa_required as user_mfa_required,
        u.role
       FROM mfa_secrets ms
       RIGHT JOIN users u ON ms.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return {
        configured: false,
        enabled: false,
        required: false
      };
    }

    const data = result.rows[0];

    return {
      configured: data.enabled !== null,
      enabled: data.user_mfa_enabled || false,
      required: data.user_mfa_required || isMFARequired(data.role),
      enabledAt: data.enabled_at,
      lastUsedAt: data.last_used_at
    };

  } catch (error) {
    logger.error('Errore recupero stato MFA:', error);
    throw error;
  }
};

/**
 * Regenerate backup codes
 */
export const regenerateBackupCodes = async (userId) => {
  const client = await pool.connect();

  try {
    // Check if MFA is enabled
    const existing = await client.query(
      'SELECT enabled FROM mfa_secrets WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length === 0 || !existing.rows[0].enabled) {
      throw new Error('MFA non abilitato');
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code));

    await client.query(
      'UPDATE mfa_secrets SET backup_codes = $1 WHERE user_id = $2',
      [JSON.stringify(hashedBackupCodes), userId]
    );

    logger.info(`✅ Backup codes rigenerati per user #${userId}`);

    return { backupCodes };

  } catch (error) {
    logger.error('Errore rigenerazione backup codes:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default {
  isMFARequired,
  setupMFA,
  verifyAndEnableMFA,
  verifyMFAToken,
  disableMFA,
  getMFAStatus,
  regenerateBackupCodes
};
