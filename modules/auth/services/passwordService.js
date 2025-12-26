import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { pool } from '../../../core/database/connection.js';
import { resend } from '../../../core/config/email.js';
import logger from '../../../core/utils/logger.js';

const SALT_ROUNDS = 12;

/**
 * Password Service
 * Handles password reset and recovery operations
 */

/**
 * Generate secure random token
 */
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash token for storage
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Request password reset
 * Generates token and sends reset email
 */
export const requestPasswordReset = async (email) => {
  const client = await pool.connect();

  try {
    // Check if user exists
    const userResult = await client.query(
      'SELECT id, email, name, active FROM users WHERE email = $1',
      [email]
    );

    // Don't reveal if email exists (security best practice)
    if (userResult.rows.length === 0) {
      logger.warn(`⚠️  Password reset richiesto per email inesistente: ${email}`);
      return {
        success: true,
        message: 'Se l\'email esiste, riceverai le istruzioni per il reset'
      };
    }

    const user = userResult.rows[0];

    // Check if account is active
    if (!user.active) {
      logger.warn(`⚠️  Password reset richiesto per account disabilitato: ${email}`);
      return {
        success: true,
        message: 'Se l\'email esiste, riceverai le istruzioni per il reset'
      };
    }

    // Generate token
    const token = generateToken();
    const hashedToken = hashToken(token);
    const expiresAt = new Date(
      Date.now() + (parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY) || 60) * 60 * 1000
    );

    // Store token in database
    await client.query('BEGIN');

    // Delete any existing reset tokens for this user
    await client.query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1',
      [user.id]
    );

    // Insert new token
    await client.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, hashedToken, expiresAt]
    );

    await client.query('COMMIT');

    // Send reset email
    const resetUrl = `${process.env.PASSWORD_RESET_URL_BASE || 'http://localhost:3000/reset-password'}?token=${token}`;

    if (resend) {
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
          to: email,
          subject: '🔐 Recupero Password - CertiCredia Italia',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8fafc; padding: 30px; }
                .footer { background: #1e293b; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
                .button { display: inline-block; padding: 12px 30px; background: #0891b2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">🔐 Recupero Password</h1>
                </div>
                <div class="content">
                  <h2 style="color: #0891b2;">Ciao ${user.name}!</h2>
                  <p>Hai richiesto il recupero della password per il tuo account CertiCredia Italia.</p>
                  <p>Clicca sul pulsante qui sotto per reimpostare la tua password:</p>
                  <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Reimposta Password</a>
                  </div>
                  <p style="font-size: 14px; color: #64748b;">
                    Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br>
                    <a href="${resetUrl}" style="color: #0891b2; word-break: break-all;">${resetUrl}</a>
                  </p>
                  <div class="warning">
                    <p style="margin: 0; font-weight: bold; color: #ef4444;">⚠️ IMPORTANTE</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">
                      • Questo link scadrà tra ${process.env.PASSWORD_RESET_TOKEN_EXPIRY || 60} minuti<br>
                      • Se non hai richiesto tu questo reset, ignora questa email<br>
                      • Non condividere mai questo link con nessuno
                    </p>
                  </div>
                  <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
                    Per domande, contattaci a
                    <a href="mailto:${process.env.NOTIFICATION_EMAIL || 'request@certicredia.org'}" style="color: #0891b2;">
                      ${process.env.NOTIFICATION_EMAIL || 'request@certicredia.org'}
                    </a>
                  </p>
                </div>
                <div class="footer">
                  <p>© 2025 CertiCredia Italia S.r.l. - Certificazioni Cybersecurity</p>
                </div>
              </div>
            </body>
            </html>
          `
        });

        logger.info(`✅ Email recupero password inviata a: ${email}`);
      } catch (emailError) {
        logger.error(`❌ Errore invio email recupero password a ${email}:`, emailError);
        throw new Error('Impossibile inviare email di recupero password');
      }
    }

    return {
      success: true,
      message: 'Se l\'email esiste, riceverai le istruzioni per il reset'
    };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore richiesta reset password:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Validate reset token
 */
export const validateResetToken = async (token) => {
  const hashedToken = hashToken(token);

  const result = await pool.query(
    `SELECT prt.user_id, prt.expires_at, u.email, u.active
     FROM password_reset_tokens prt
     JOIN users u ON prt.user_id = u.id
     WHERE prt.token_hash = $1 AND prt.used_at IS NULL`,
    [hashedToken]
  );

  if (result.rows.length === 0) {
    return { valid: false, error: 'Token non valido o già utilizzato' };
  }

  const tokenData = result.rows[0];

  // Check if expired
  if (new Date() > new Date(tokenData.expires_at)) {
    return { valid: false, error: 'Token scaduto. Richiedi un nuovo reset' };
  }

  // Check if account is active
  if (!tokenData.active) {
    return { valid: false, error: 'Account disabilitato' };
  }

  return {
    valid: true,
    userId: tokenData.user_id,
    email: tokenData.email
  };
};

/**
 * Reset password with token
 */
export const resetPassword = async (token, newPassword) => {
  const client = await pool.connect();

  try {
    // Validate token
    const validation = await validateResetToken(token);

    if (!validation.valid) {
      return {
        success: false,
        message: validation.error
      };
    }

    const hashedToken = hashToken(token);

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await client.query('BEGIN');

    // Update password
    await client.query(
      `UPDATE users
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [passwordHash, validation.userId]
    );

    // Mark token as used
    await client.query(
      `UPDATE password_reset_tokens
       SET used_at = CURRENT_TIMESTAMP
       WHERE token_hash = $1`,
      [hashedToken]
    );

    await client.query('COMMIT');

    logger.info(`✅ Password reimpostata per: ${validation.email}`);

    // Send confirmation email
    if (resend) {
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
          to: validation.email,
          subject: '✅ Password Modificata - CertiCredia Italia',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8fafc; padding: 30px; }
                .footer { background: #1e293b; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
                .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">✅ Password Modificata</h1>
                </div>
                <div class="content">
                  <h2 style="color: #10b981;">Password Aggiornata con Successo!</h2>
                  <p>La tua password è stata modificata con successo.</p>
                  <p>Ora puoi effettuare il login con la nuova password.</p>
                  <div class="warning">
                    <p style="margin: 0; font-weight: bold; color: #ef4444;">⚠️ NON HAI RICHIESTO TU QUESTA MODIFICA?</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">
                      Se non hai richiesto tu il cambio password, contattaci <strong>IMMEDIATAMENTE</strong> a
                      <a href="mailto:${process.env.NOTIFICATION_EMAIL || 'request@certicredia.org'}" style="color: #ef4444;">
                        ${process.env.NOTIFICATION_EMAIL || 'request@certicredia.org'}
                      </a>
                    </p>
                  </div>
                  <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
                    Data modifica: ${new Date().toLocaleString('it-IT')}
                  </p>
                </div>
                <div class="footer">
                  <p>© 2025 CertiCredia Italia S.r.l. - Certificazioni Cybersecurity</p>
                </div>
              </div>
            </body>
            </html>
          `
        });
      } catch (emailError) {
        logger.error(`❌ Errore invio email conferma reset a ${validation.email}:`, emailError);
        // Don't fail the reset if email fails
      }
    }

    return {
      success: true,
      message: 'Password reimpostata con successo. Ora puoi effettuare il login.'
    };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore reset password:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password) => {
  const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH) || 12;
  const requireUppercase = process.env.PASSWORD_REQUIRE_UPPERCASE === 'true';
  const requireLowercase = process.env.PASSWORD_REQUIRE_LOWERCASE === 'true';
  const requireNumbers = process.env.PASSWORD_REQUIRE_NUMBERS === 'true';
  const requireSpecial = process.env.PASSWORD_REQUIRE_SPECIAL === 'true';

  const errors = [];

  if (password.length < minLength) {
    errors.push(`La password deve contenere almeno ${minLength} caratteri`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera maiuscola');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera minuscola');
  }

  if (requireNumbers && !/\d/.test(password)) {
    errors.push('La password deve contenere almeno un numero');
  }

  if (requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('La password deve contenere almeno un carattere speciale');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Clean expired tokens (to be run by cron job)
 */
export const cleanExpiredTokens = async () => {
  try {
    const result = await pool.query(
      'DELETE FROM password_reset_tokens WHERE expires_at < CURRENT_TIMESTAMP'
    );

    logger.info(`🧹 Rimossi ${result.rowCount} token di reset scaduti`);

    return {
      success: true,
      deletedCount: result.rowCount
    };
  } catch (error) {
    logger.error('Errore pulizia token scaduti:', error);
    throw error;
  }
};
