import bcrypt from 'bcrypt';
import { pool } from '../config/database.js';
import { generateAccessToken, generateRefreshToken, createUserPayload } from '../config/auth.js';
import { resend } from '../config/email.js';
import logger from '../utils/logger.js';

const SALT_ROUNDS = 12;

/**
 * Register new user
 */
export const register = async (req, res) => {
  const client = await pool.connect();

  try {
    const { email, password, name, company, phone } = req.body;

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email già registrata. Effettua il login o recupera la password.'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO users (email, password_hash, name, company, phone, role)
       VALUES ($1, $2, $3, $4, $5, 'user')
       RETURNING id, email, name, role, company, created_at`,
      [email, passwordHash, name, company || null, phone || null]
    );

    await client.query('COMMIT');

    const user = result.rows[0];

    // Generate tokens
    const userPayload = createUserPayload(user);
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);

    logger.info(`✅ Nuovo utente registrato: ${email}`);

    // Send welcome email (non-blocking)
    if (resend) {
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
          to: email,
          subject: '🎉 Benvenuto su CertiCredia Italia!',
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
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">🛡️ CertiCredia Italia</h1>
                </div>
                <div class="content">
                  <h2 style="color: #0891b2;">Benvenuto ${name}!</h2>
                  <p>Grazie per esserti registrato su <strong>CertiCredia Italia</strong>!</p>
                  <p>Il tuo account è stato creato con successo. Ora puoi:</p>
                  <ul>
                    <li>Sfogliare il nostro catalogo di certificazioni</li>
                    <li>Aggiungere prodotti al carrello</li>
                    <li>Effettuare ordini e gestire le tue certificazioni</li>
                  </ul>
                  <div style="text-align: center;">
                    <a href="https://certicredia.onrender.com" class="button">Inizia Subito</a>
                  </div>
                  <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
                    Per qualsiasi domanda, contattaci a
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
        logger.info(`✅ Email di benvenuto inviata a: ${email}`);
      } catch (emailError) {
        logger.error(`❌ Errore invio email di benvenuto a ${email}:`, emailError);
        // Don't fail registration if email fails
      }
    }

    // Set cookie (optional - can also use localStorage on frontend)
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'Registrazione completata con successo',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          company: user.company
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore registrazione:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante la registrazione. Riprova più tardi.'
    });
  } finally {
    client.release();
  }
};

/**
 * Login user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user
    const result = await pool.query(
      `SELECT id, email, password_hash, name, role, company, active, email_verified
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email o password non corretti'
      });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Account disabilitato. Contatta il supporto.'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email o password non corretti'
      });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const userPayload = createUserPayload(user);
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);

    logger.info(`✅ Login effettuato: ${email}`);

    // Set cookie
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Login effettuato con successo',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          company: user.company,
          emailVerified: user.email_verified
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    logger.error('Errore login:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante il login. Riprova più tardi.'
    });
  }
};

/**
 * Logout user
 */
export const logout = (req, res) => {
  res.clearCookie('token');

  res.json({
    success: true,
    message: 'Logout effettuato con successo'
  });
};

/**
 * Get current user profile
 */
export const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, name, role, company, phone, address, city, postal_code, country,
              created_at, email_verified
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Errore recupero profilo:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero del profilo'
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, company, phone, address, city, postal_code, country } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           company = COALESCE($2, company),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           city = COALESCE($5, city),
           postal_code = COALESCE($6, postal_code),
           country = COALESCE($7, country),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING id, email, name, role, company, phone, address, city, postal_code, country`,
      [name, company, phone, address, city, postal_code, country, req.user.id]
    );

    logger.info(`✅ Profilo aggiornato: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Profilo aggiornato con successo',
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Errore aggiornamento profilo:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante l\'aggiornamento del profilo'
    });
  }
};

/**
 * Change password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      result.rows[0].password_hash
    );

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Password attuale non corretta'
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await pool.query(
      `UPDATE users
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newPasswordHash, req.user.id]
    );

    logger.info(`✅ Password cambiata: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Password cambiata con successo'
    });

  } catch (error) {
    logger.error('Errore cambio password:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante il cambio password'
    });
  }
};

/**
 * Verify email (placeholder - requires email sending implementation)
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // TODO: Implement email verification token logic
    // For now, just mark as verified

    await pool.query(
      'UPDATE users SET email_verified = true WHERE id = $1',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Email verificata con successo'
    });

  } catch (error) {
    logger.error('Errore verifica email:', error);

    res.status(500).json({
      success: false,
      message: 'Errore durante la verifica dell\'email'
    });
  }
};
