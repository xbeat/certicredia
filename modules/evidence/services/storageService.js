import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { pool } from '../../../server/config/database.js';
import logger from '../../../server/utils/logger.js';

/**
 * Evidence Storage Service
 * Handles file upload to S3/Cloudflare R2 with signed URLs
 */

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.STORAGE_REGION || 'auto',
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.STORAGE_SECRET_KEY
  }
});

const BUCKET = process.env.STORAGE_BUCKET || 'certicredia-evidence';
const MAX_FILE_SIZE = (parseInt(process.env.STORAGE_MAX_FILE_SIZE_MB) || 50) * 1024 * 1024; // bytes
const ALLOWED_EXTENSIONS = (process.env.STORAGE_ALLOWED_EXTENSIONS || 'pdf,doc,docx,xls,xlsx,png,jpg,jpeg,zip').split(',');

/**
 * Calculate file hash (SHA256)
 */
const calculateFileHash = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Validate file
 */
const validateFile = (file) => {
  if (!file) {
    throw new Error('Nessun file fornito');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File troppo grande. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  const extension = file.originalname.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error(`Tipo file non consentito. Consentiti: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }

  return true;
};

/**
 * Upload evidence file
 */
export const uploadEvidence = async (file, metadata) => {
  const client = await pool.connect();

  try {
    validateFile(file);

    const {
      assessmentId,
      organizationId,
      uploadedBy,
      questionId,
      description
    } = metadata;

    // Generate unique storage path
    const fileHash = calculateFileHash(file.buffer);
    const extension = file.originalname.split('.').pop();
    const storagePath = `assessments/${assessmentId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${extension}`;

    // Upload to S3/R2
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: storagePath,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        'assessment-id': String(assessmentId),
        'organization-id': String(organizationId),
        'uploaded-by': String(uploadedBy),
        'original-filename': file.originalname,
        'file-hash': fileHash
      }
    }));

    // Store metadata in database
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO evidence_files (
        assessment_id, organization_id, uploaded_by,
        file_name, file_size_bytes, file_type, mime_type,
        storage_provider, storage_path, storage_bucket,
        file_hash, question_id, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        assessmentId, organizationId, uploadedBy,
        file.originalname, file.size, extension, file.mimetype,
        process.env.STORAGE_PROVIDER || 'cloudflare', storagePath, BUCKET,
        fileHash, questionId, description
      ]
    );

    await client.query('COMMIT');

    const evidence = result.rows[0];

    logger.success(`✅ Evidence uploaded: ${file.originalname} (ID: ${evidence.id})`);

    return evidence;

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore upload evidence:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Generate signed URL for download
 */
export const generateSignedUrl = async (evidenceId, userId) => {
  try {
    // Get evidence metadata
    const result = await pool.query(
      `SELECT e.*, a.organization_id as assessment_org_id
       FROM evidence_files e
       JOIN assessments a ON e.assessment_id = a.id
       WHERE e.id = $1`,
      [evidenceId]
    );

    if (result.rows.length === 0) {
      throw new Error('Evidence non trovato');
    }

    const evidence = result.rows[0];

    // TODO: Check user has access to this organization/assessment

    // Generate signed URL
    const command = new GetObjectCommand({
      Bucket: evidence.storage_bucket,
      Key: evidence.storage_path
    });

    const expiresIn = parseInt(process.env.STORAGE_SIGNED_URL_EXPIRY) || 3600; // 1 hour
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });

    // Update access tracking
    await pool.query(
      `UPDATE evidence_files
       SET accessed_at = CURRENT_TIMESTAMP, access_count = access_count + 1
       WHERE id = $1`,
      [evidenceId]
    );

    logger.info(`✅ Signed URL generato per evidence #${evidenceId} (scade in ${expiresIn}s)`);

    return {
      url: signedUrl,
      expiresIn,
      fileName: evidence.file_name,
      fileSize: evidence.file_size_bytes
    };

  } catch (error) {
    logger.error('Errore generazione signed URL:', error);
    throw error;
  }
};

/**
 * List evidence for assessment
 */
export const listAssessmentEvidence = async (assessmentId) => {
  try {
    const result = await pool.query(
      `SELECT
        e.*,
        u.name as uploaded_by_name, u.email as uploaded_by_email
       FROM evidence_files e
       LEFT JOIN users u ON e.uploaded_by = u.id
       WHERE e.assessment_id = $1
       ORDER BY e.uploaded_at DESC`,
      [assessmentId]
    );

    return result.rows;

  } catch (error) {
    logger.error('Errore lista evidence:', error);
    throw error;
  }
};

/**
 * Delete evidence
 */
export const deleteEvidence = async (evidenceId, deletedBy) => {
  const client = await pool.connect();

  try {
    // Get evidence metadata
    const result = await client.query(
      'SELECT * FROM evidence_files WHERE id = $1',
      [evidenceId]
    );

    if (result.rows.length === 0) {
      throw new Error('Evidence non trovato');
    }

    const evidence = result.rows[0];

    await client.query('BEGIN');

    // Delete from storage
    await s3Client.send(new DeleteObjectCommand({
      Bucket: evidence.storage_bucket,
      Key: evidence.storage_path
    }));

    // Delete from database
    await client.query('DELETE FROM evidence_files WHERE id = $1', [evidenceId]);

    await client.query('COMMIT');

    logger.info(`✅ Evidence eliminato: ${evidence.file_name} (ID: ${evidenceId})`);

    return { success: true };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Errore eliminazione evidence:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default {
  uploadEvidence,
  generateSignedUrl,
  listAssessmentEvidence,
  deleteEvidence
};
