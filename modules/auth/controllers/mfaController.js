import {
  setupMFA,
  verifyAndEnableMFA,
  verifyMFAToken,
  disableMFA,
  getMFAStatus,
  regenerateBackupCodes
} from '../services/mfaService.js';
import bcrypt from 'bcrypt';
import { pool } from '../../../core/database/connection.js';
import logger from '../../../core/utils/logger.js';

/**
 * MFA Controller
 * Handles MFA/2FA endpoints
 */

/**
 * POST /api/auth/mfa/setup
 * Start MFA setup process
 */
export const startMFASetup = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    const result = await setupMFA(userId, userEmail);

    res.json({
      success: true,
      message: 'Setup MFA iniziato. Scansiona il QR code con la tua app di autenticazione.',
      data: {
        qrCode: result.qrCode,
        secret: result.secret, // Show for manual entry
        backupCodes: result.backupCodes // IMPORTANT: Save these securely
      }
    });

  } catch (error) {
    logger.error('Errore start MFA setup:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Errore durante il setup MFA'
    });
  }
};

/**
 * POST /api/auth/mfa/verify
 * Verify TOTP token and enable MFA
 */
export const verifyMFA = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    if (!token || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Codice TOTP obbligatorio'
      });
    }

    await verifyAndEnableMFA(userId, token.trim());

    res.json({
      success: true,
      message: 'MFA abilitato con successo! Il tuo account è ora più sicuro.'
    });

  } catch (error) {
    logger.error('Errore verifica MFA:', error);

    res.status(400).json({
      success: false,
      message: error.message || 'Codice non valido'
    });
  }
};

/**
 * POST /api/auth/mfa/validate
 * Validate MFA token during login
 */
export const validateMFAToken = async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        message: 'User ID e codice obbligatori'
      });
    }

    const result = await verifyMFAToken(userId, token.trim());

    res.json({
      success: true,
      message: 'Codice verificato con successo',
      data: {
        method: result.method,
        remainingBackupCodes: result.remainingBackupCodes
      }
    });

  } catch (error) {
    logger.error('Errore validazione MFA token:', error);

    res.status(401).json({
      success: false,
      message: 'Codice non valido'
    });
  }
};

/**
 * POST /api/auth/mfa/disable
 * Disable MFA for user
 */
export const disableMFAHandler = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password obbligatoria per disabilitare MFA'
      });
    }

    // Verify password
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    const isValidPassword = await bcrypt.compare(password, userResult.rows[0].password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Password non corretta'
      });
    }

    await disableMFA(userId, password);

    res.json({
      success: true,
      message: 'MFA disabilitato. Il tuo account è meno sicuro ora.'
    });

  } catch (error) {
    logger.error('Errore disabilitazione MFA:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Errore durante la disabilitazione MFA'
    });
  }
};

/**
 * GET /api/auth/mfa/status
 * Get MFA status for current user
 */
export const getMFAStatusHandler = async (req, res) => {
  try {
    const userId = req.user.id;

    const status = await getMFAStatus(userId);

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    logger.error('Errore recupero stato MFA:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero dello stato MFA'
    });
  }
};

/**
 * POST /api/auth/mfa/backup-codes/regenerate
 * Regenerate backup codes
 */
export const regenerateBackupCodesHandler = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password obbligatoria'
      });
    }

    // Verify password
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    const isValidPassword = await bcrypt.compare(password, userResult.rows[0].password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Password non corretta'
      });
    }

    const result = await regenerateBackupCodes(userId);

    res.json({
      success: true,
      message: 'Backup codes rigenerati. SALVALI IN UN POSTO SICURO!',
      data: {
        backupCodes: result.backupCodes
      }
    });

  } catch (error) {
    logger.error('Errore rigenerazione backup codes:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Errore durante la rigenerazione dei backup codes'
    });
  }
};
