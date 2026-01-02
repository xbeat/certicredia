import { Resend } from 'resend';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

// Initialize Resend client
let resend = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  logger.info('✅ Resend email service initialized');
} else {
  logger.warn('⚠️  RESEND_API_KEY non configurata. Email non verranno inviate.');
}

// Default sender email (Resend requires verified domain or use onboarding@resend.dev)
const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'request@certicredia.org';

/**
 * Send contact form notification email
 * @param {Object} data - Contact form data
 * @returns {Promise<Object>} - Email send result
 */
const sendContactNotification = async (data) => {
  if (!resend) {
    logger.warn('Email service non configurato. Simulazione invio email.');
    return {
      success: false,
      message: 'Email service non configurato',
      simulated: true
    };
  }

  const { userType, name, email, company, linkedin, message } = data;

  // Determine subject based on user type
  const subject = userType === 'COMPANY'
    ? `🏢 Nuova Richiesta Azienda - ${company || name}`
    : `👤 Nuova Candidatura Specialist - ${name}`;

  // Build email HTML
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .field { margin-bottom: 20px; padding: 15px; background: white; border-left: 4px solid #0891b2; border-radius: 5px; }
        .label { font-weight: bold; color: #0891b2; margin-bottom: 5px; text-transform: uppercase; font-size: 12px; }
        .value { color: #1e293b; font-size: 14px; }
        .badge { display: inline-block; padding: 5px 15px; background: #06b6d4; color: white; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .footer { margin-top: 20px; text-align: center; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🛡️ CertiCredia Italia</h1>
          <p style="margin: 10px 0 0 0;">Nuova Richiesta di Contatto</p>
        </div>
        <div class="content">
          <div style="margin-bottom: 20px;">
            <span class="badge">${userType === 'COMPANY' ? 'AZIENDA' : 'SPECIALISTA'}</span>
          </div>

          <div class="field">
            <div class="label">Nome</div>
            <div class="value">${name}</div>
          </div>

          <div class="field">
            <div class="label">Email</div>
            <div class="value"><a href="mailto:${email}">${email}</a></div>
          </div>

          ${company ? `
          <div class="field">
            <div class="label">Azienda & P.IVA</div>
            <div class="value">${company}</div>
          </div>
          ` : ''}

          ${linkedin ? `
          <div class="field">
            <div class="label">LinkedIn / CV</div>
            <div class="value"><a href="${linkedin}" target="_blank">${linkedin}</a></div>
          </div>
          ` : ''}

          ${message ? `
          <div class="field">
            <div class="label">Messaggio</div>
            <div class="value">${message.replace(/\n/g, '<br>')}</div>
          </div>
          ` : ''}

          <div class="field">
            <div class="label">Data/Ora Ricezione</div>
            <div class="value">${new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}</div>
          </div>

          <div class="footer">
            <p>Questo messaggio è stato generato automaticamente dal sistema CertiCredia.</p>
            <p>Per rispondere, utilizzare l'indirizzo email fornito sopra.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: NOTIFICATION_EMAIL,
      reply_to: email,
      subject: subject,
      html: htmlContent,
    });

    logger.info(`✅ Email inviata: ${result.id}`);
    return {
      success: true,
      messageId: result.id,
      message: 'Email inviata con successo'
    };
  } catch (error) {
    logger.error('❌ Errore invio email:', error);
    throw error;
  }
};

/**
 * Send auto-response email to the user
 * @param {Object} data - Contact form data
 * @returns {Promise<Object>} - Email send result
 */
const sendAutoResponse = async (data) => {
  if (!resend) {
    return { success: false, message: 'Email service non configurato', simulated: true };
  }

  const { name, email, userType } = data;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; }
        .footer { background: #1e293b; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🛡️ CertiCredia Italia</h1>
        </div>
        <div class="content">
          <h2 style="color: #0891b2;">Ciao ${name},</h2>
          <p>Grazie per il tuo interesse in <strong>CertiCredia Italia</strong>!</p>
          <p>Abbiamo ricevuto la tua ${userType === 'COMPANY' ? 'richiesta di certificazione' : 'candidatura come specialista'} e il nostro team ti contatterà entro <strong>24 ore lavorative</strong>.</p>

          <div style="background: white; padding: 20px; border-left: 4px solid #06b6d4; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0;"><strong>📧 Per qualsiasi urgenza, contattaci a:</strong></p>
            <p style="margin: 10px 0 0 0;"><a href="mailto:${NOTIFICATION_EMAIL}" style="color: #0891b2;">${NOTIFICATION_EMAIL}</a></p>
          </div>

          <p>Nel frattempo, puoi visitare il nostro sito per saperne di più sui nostri servizi.</p>

          <p style="margin-top: 30px;">A presto,<br><strong>Il Team CertiCredia</strong></p>
        </div>
        <div class="footer">
          <p>© 2025 CertiCredia Italia S.r.l. - Certificazioni Cybersecurity</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '✅ Richiesta Ricevuta - CertiCredia Italia',
      html: htmlContent,
    });

    logger.info(`✅ Auto-risposta inviata a: ${email}`);
    return {
      success: true,
      messageId: result.id
    };
  } catch (error) {
    logger.error('❌ Errore invio auto-risposta:', error);
    // Non bloccare la richiesta se l'auto-risposta fallisce
    return { success: false, error: error.message };
  }
};

/**
 * Send order confirmation email to customer
 */
export const sendOrderConfirmation = async (orderData) => {
  if (!resend) {
    return { success: false, message: 'Email service non configurato', simulated: true };
  }

  const { order, items, user } = orderData;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; }
        .order-item { background: white; padding: 15px; margin-bottom: 10px; border-left: 4px solid #0891b2; border-radius: 5px; }
        .total { background: #0891b2; color: white; padding: 20px; border-radius: 5px; margin-top: 20px; }
        .footer { background: #1e293b; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🛡️ CertiCredia Italia</h1>
          <p style="margin: 10px 0 0 0;">Conferma Ordine</p>
        </div>
        <div class="content">
          <h2 style="color: #0891b2;">Grazie per il tuo ordine!</h2>
          <p>Ciao <strong>${user.name}</strong>,</p>
          <p>Abbiamo ricevuto il tuo ordine e lo stiamo processando.</p>

          <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Numero Ordine:</strong> ${order.order_number}</p>
            <p style="margin: 5px 0 0 0;"><strong>Data:</strong> ${new Date(order.created_at).toLocaleString('it-IT')}</p>
          </div>

          <h3 style="color: #0891b2;">Dettagli Ordine</h3>
          ${items.map(item => `
            <div class="order-item">
              <strong>${item.product_name}</strong><br>
              <small>Quantità: ${item.quantity} × €${parseFloat(item.unit_price).toFixed(0)}</small><br>
              <strong>€${parseFloat(item.total_price).toFixed(0)}</strong>
            </div>
          `).join('')}

          <div class="total">
            <div style="display: flex; justify-content: space-between; font-size: 24px;">
              <strong>Totale:</strong>
              <strong>€${parseFloat(order.total_amount).toFixed(0)}</strong>
            </div>
          </div>

          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px; border-radius: 5px;">
            <strong>🏦 Metodo di Pagamento:</strong> ${order.payment_method === 'bank_transfer' ? 'Bonifico Bancario' : order.payment_method}<br>
            <small>Riceverai le istruzioni per il pagamento via email separata.</small>
          </div>

          <p style="margin-top: 30px;">Per qualsiasi domanda, contattaci a <a href="mailto:${NOTIFICATION_EMAIL}">${NOTIFICATION_EMAIL}</a></p>
        </div>
        <div class="footer">
          <p>© 2025 CertiCredia Italia S.r.l. - Certificazioni Cybersecurity</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `Conferma Ordine ${order.order_number} - CertiCredia`,
      html: htmlContent,
    });

    logger.info(`✅ Email conferma ordine inviata a: ${user.email}`);
    return { success: true, messageId: result.id };
  } catch (error) {
    logger.error('❌ Errore invio email conferma ordine:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send order notification to admin
 */
export const sendOrderNotificationToAdmin = async (orderData) => {
  if (!resend) {
    return { success: false, simulated: true };
  }

  const { order, items, user } = orderData;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e293b; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 20px; }
        .info-box { background: white; padding: 15px; border-left: 4px solid #0891b2; margin-bottom: 15px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🆕 Nuovo Ordine Ricevuto</h1>
        </div>
        <div class="content">
          <div class="info-box">
            <strong>Numero Ordine:</strong> ${order.order_number}<br>
            <strong>Cliente:</strong> ${user.name} (${user.email})<br>
            <strong>Totale:</strong> €${parseFloat(order.total_amount).toFixed(0)}<br>
            <strong>Metodo Pagamento:</strong> ${order.payment_method}
          </div>

          <h3>Prodotti</h3>
          ${items.map(item => `<div class="info-box">${item.product_name} x${item.quantity} = €${parseFloat(item.total_price).toFixed(0)}</div>`).join('')}

          <div class="info-box">
            <strong>Indirizzo:</strong><br>
            ${order.billing_name}<br>
            ${order.billing_address}<br>
            ${order.billing_city} ${order.billing_postal_code}<br>
            Tel: ${order.billing_phone}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: NOTIFICATION_EMAIL,
      subject: `Nuovo Ordine ${order.order_number}`,
      html: htmlContent,
    });

    logger.info(`✅ Notifica ordine inviata agli admin`);
    return { success: true, messageId: result.id };
  } catch (error) {
    logger.error('❌ Errore invio notifica ordine:', error);
    return { success: false, error: error.message };
  }
};

export { resend, sendContactNotification, sendAutoResponse };
