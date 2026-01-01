/**
 * Delete All CPF Auditing Data
 *
 * Deletes all CPF assessment data from the database.
 * Useful for regenerating data from scratch.
 *
 * Usage: node scripts/delete-all-cpf-data.js
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const {
  DB_HOST = 'localhost',
  DB_PORT = 5432,
  DB_NAME = 'certicredia',
  DB_USER = 'certicredia_user',
  DB_PASSWORD = 'your_secure_password_here'
} = process.env;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function deleteAllCPFData() {
  const config = {
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD
  };

  const url = new URL(process.env.DATABASE_URL || '');
  if (process.env.DATABASE_URL) {
    config.connectionString = process.env.DATABASE_URL;
    config.ssl = url.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : false;
  }

  const client = new pg.Client(config);

  try {
    await client.connect();

    log('\n🗑️  Deleting all CPF assessment data...\n', colors.yellow);

    const result = await client.query('DELETE FROM cpf_auditing_assessments RETURNING id');

    log(`✅ Deleted ${result.rowCount} CPF assessment record(s)\n`, colors.green);

  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

deleteAllCPFData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
