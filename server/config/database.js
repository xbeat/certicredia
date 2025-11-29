import pg from 'pg';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const { Pool } = pg;

// PostgreSQL connection configuration (Neon compatible)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection
pool.on('connect', () => {
  logger.info('✅ Database PostgreSQL connesso');
});

pool.on('error', (err) => {
  logger.error('❌ Errore database PostgreSQL:', err);
});

// Initialize database schema
const initDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create contacts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('COMPANY', 'SPECIALIST')),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        linkedin VARCHAR(500),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT,
        status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
        notes TEXT
      );
    `);

    // Create index for email lookup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
    `);

    // Create index for created_at for faster sorting
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);
    `);

    // Create index for status
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
    `);

    await client.query('COMMIT');
    logger.info('✅ Schema database inizializzato');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Errore inizializzazione schema:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Initialize database on startup
initDatabase().catch(err => {
  logger.error('Impossibile inizializzare il database:', err);
  process.exit(1);
});

export { pool, initDatabase };
