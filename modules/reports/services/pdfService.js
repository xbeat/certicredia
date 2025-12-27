import PDFDocument from 'pdfkit';
import crypto from 'crypto';
import { pool } from '../../../server/config/database.js';
import logger from '../../../server/utils/logger.js';

/**
 * PDF Report Generation Service
 * Generates accreditation certificates as PDF
 */

/**
 * Generate accreditation certificate PDF
 */
export const generateAccreditationCertificate = async (assessmentId) => {
  try {
    // Get assessment data
    const result = await pool.query(
      `SELECT
        a.*,
        o.name as org_name, o.organization_type, o.vat_number,
        o.address, o.city, o.country,
        t.name as template_name, t.version as template_version,
        s.name as specialist_name, s.email as specialist_email
       FROM assessments a
       JOIN organizations o ON a.organization_id = o.id
       JOIN assessment_templates t ON a.template_id = t.id
       LEFT JOIN users s ON a.approved_by = s.id
       WHERE a.id = $1 AND a.status = 'approved'`,
      [assessmentId]
    );

    if (result.rows.length === 0) {
      throw new Error('Assessment non trovato o non approvato');
    }

    const data = result.rows[0];

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('CERTIFICATO DI ACCREDITAMENTO', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).font('Helvetica').text(process.env.PDF_COMPANY_NAME || 'CertiCredia Italia S.r.l.', { align: 'center' });
    doc.moveDown(2);

    // Certificate details
    doc.fontSize(12).font('Helvetica-Bold').text('Organizzazione:');
    doc.font('Helvetica').text(data.org_name);
    doc.moveDown();

    doc.font('Helvetica-Bold').text('Tipo:');
    doc.font('Helvetica').text(data.organization_type);
    doc.moveDown();

    doc.font('Helvetica-Bold').text('Framework:');
    doc.font('Helvetica').text(`${data.template_name} (v${data.template_version})`);
    doc.moveDown();

    doc.font('Helvetica-Bold').text('Data Approvazione:');
    doc.font('Helvetica').text(new Date(data.approved_at).toLocaleDateString('it-IT'));
    doc.moveDown();

    doc.font('Helvetica-Bold').text('Data Scadenza:');
    doc.font('Helvetica').text(new Date(data.expires_at).toLocaleDateString('it-IT'));
    doc.moveDown();

    doc.font('Helvetica-Bold').text('Specialist Approvatore:');
    doc.font('Helvetica').text(data.specialist_name || 'N/A');
    doc.moveDown(2);

    // Footer
    doc.fontSize(10).font('Helvetica').text(
      `Documento generato il ${new Date().toLocaleString('it-IT')}`,
      50, 700,
      { align: 'center' }
    );

    doc.text(
      process.env.PDF_COMPANY_ADDRESS || 'Via Example 123, 00100 Roma, Italia',
      50, 720,
      { align: 'center' }
    );

    // Finalize PDF
    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        const pdfHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

        logger.success(`✅ PDF certificato generato per assessment #${assessmentId}`);

        resolve({
          buffer: pdfBuffer,
          hash: pdfHash,
          fileName: `Certificato_Accreditamento_${data.org_name}_${Date.now()}.pdf`
        });
      });

      doc.on('error', reject);
    });

  } catch (error) {
    logger.error('Errore generazione PDF:', error);
    throw error;
  }
};

/**
 * Generate assessment report PDF
 */
export const generateAssessmentReport = async (assessmentData) => {
  try {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('REPORT DI ASSESSMENT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).font('Helvetica').text(assessmentData.organization_name, { align: 'center' });
    doc.moveDown(2);

    // Details
    doc.fontSize(12).font('Helvetica-Bold').text('Informazioni Assessment:');
    doc.font('Helvetica').text(`Template: ${assessmentData.template_name}`);
    doc.text(`Tipo: ${assessmentData.template_type}`);
    doc.text(`Stato: ${assessmentData.status}`);
    doc.text(`Data Creazione: ${new Date(assessmentData.created_at).toLocaleDateString('it-IT')}`);
    if (assessmentData.submitted_at) {
      doc.text(`Data Sottomissione: ${new Date(assessmentData.submitted_at).toLocaleDateString('it-IT')}`);
    }
    if (assessmentData.approved_at) {
      doc.text(`Data Approvazione: ${new Date(assessmentData.approved_at).toLocaleDateString('it-IT')}`);
    }
    doc.moveDown(2);

    // Organization info
    doc.font('Helvetica-Bold').text('Organizzazione:');
    doc.font('Helvetica').text(assessmentData.organization_name);
    if (assessmentData.vat_number) doc.text(`P.IVA: ${assessmentData.vat_number}`);
    if (assessmentData.address) doc.text(`Indirizzo: ${assessmentData.address}`);
    if (assessmentData.city) doc.text(`Città: ${assessmentData.city}`);
    doc.moveDown(2);

    // Footer
    doc.fontSize(10).font('Helvetica').text(
      `Report generato il ${new Date().toLocaleString('it-IT')}`,
      50, 700,
      { align: 'center' }
    );

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', reject);
    });

  } catch (error) {
    logger.error('Error generating assessment report:', error);
    throw error;
  }
};

/**
 * Generate certificate PDF (alias)
 */
export const generateCertificate = generateAccreditationCertificate;

export default {
  generateAccreditationCertificate,
  generateAssessmentReport,
  generateCertificate
};
