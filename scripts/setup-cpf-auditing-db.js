/**
 * CPF Auditing Database Setup Script
 *
 * This script:
 * 1. Checks if the database exists, creates it if not
 * 2. Checks if the user exists, creates it if not
 * 3. Creates the cpf_auditing_assessments table if it doesn't exist
 * 4. Sets up indices and triggers
 *
 * Usage: node scripts/setup-cpf-auditing-db.js
 */

import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const {
  DB_HOST = 'localhost',
  DB_PORT = 5432,
  DB_NAME = 'certicredia',
  DB_USER = 'certicredia_user',
  DB_PASSWORD = 'your_secure_password_here'
} = process.env;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Create database and user if they don't exist
 */
async function setupDatabase() {
  log('\n🔧 CPF Auditing Database Setup', colors.blue);
  log('=' .repeat(50), colors.blue);

  // Connect to postgres database (default) to create our database
  // Parse DATABASE_URL if available, otherwise use individual env vars
  let adminConfig;
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    adminConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: 'postgres',
      user: url.username,
      password: url.password,
      ssl: url.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : false
    };
  } else {
    adminConfig = {
      host: DB_HOST,
      port: DB_PORT,
      database: 'postgres',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || DB_PASSWORD
    };
  }

  const adminClient = new pg.Client(adminConfig);

  try {
    await adminClient.connect();
    log('\n✓ Connected to PostgreSQL server', colors.green);

    // Check if user exists
    const userCheck = await adminClient.query(
      "SELECT 1 FROM pg_roles WHERE rolname = $1",
      [DB_USER]
    );

    if (userCheck.rows.length === 0) {
      log(`\n📝 Creating user '${DB_USER}'...`, colors.yellow);
      await adminClient.query(`CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}'`);
      log(`✓ User '${DB_USER}' created`, colors.green);
    } else {
      log(`\n✓ User '${DB_USER}' already exists`, colors.green);
    }

    // Check if database exists
    const dbCheck = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [DB_NAME]
    );

    if (dbCheck.rows.length === 0) {
      log(`\n📝 Creating database '${DB_NAME}'...`, colors.yellow);
      await adminClient.query(`CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}`);
      log(`✓ Database '${DB_NAME}' created`, colors.green);
    } else {
      log(`\n✓ Database '${DB_NAME}' already exists`, colors.green);
    }

    // Grant privileges
    log('\n📝 Granting privileges...', colors.yellow);
    await adminClient.query(`GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER}`);
    log('✓ Privileges granted', colors.green);

    await adminClient.end();

    // Connect to the target database to grant table-level permissions
    let dbConfig;
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL);
      dbConfig = {
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1), // Remove leading slash
        user: url.username,
        password: url.password,
        ssl: url.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : false
      };
    } else {
      dbConfig = {
        host: DB_HOST,
        port: DB_PORT,
        database: DB_NAME,
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || DB_PASSWORD
      };
    }
    const dbClient = new pg.Client(dbConfig);

    try {
      await dbClient.connect();

      // Grant privileges on all existing tables
      log('\n📝 Granting table privileges...', colors.yellow);
      await dbClient.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER}`);
      await dbClient.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER}`);

      // Grant default privileges for future tables
      await dbClient.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO ${DB_USER}`);
      await dbClient.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO ${DB_USER}`);

      log('✓ Table privileges granted', colors.green);

      await dbClient.end();
    } catch (error) {
      log(`\n⚠️  Warning: Could not grant table privileges: ${error.message}`, colors.yellow);
      log('You may need to grant table permissions manually', colors.yellow);
      await dbClient.end();
    }
  } catch (error) {
    log(`\n✗ Error setting up database: ${error.message}`, colors.red);
    await adminClient.end();
    throw error;
  }
}

/**
 * Create CPF auditing tables
 */
async function createTables() {
  let clientConfig;
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    clientConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Remove leading slash
      user: url.username,
      password: url.password,
      ssl: url.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : false
    };
  } else {
    clientConfig = {
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD
    };
  }
  const client = new pg.Client(clientConfig);

  try {
    await client.connect();
    log('\n✓ Connected to database', colors.green);

    // Read the schema file
    const schemaPath = path.join(__dirname, '../core/database/schema/cpf_auditing_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    log('\n📝 Creating CPF auditing tables...', colors.yellow);
    await client.query(schema);
    log('✓ CPF auditing tables created successfully', colors.green);

    // Verify table creation
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'cpf_auditing_assessments'
      );
    `);

    if (tableCheck.rows[0].exists) {
      log('✓ Table cpf_auditing_assessments verified', colors.green);

      // Get table info
      const tableInfo = await client.query(`
        SELECT
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns
        WHERE table_name = 'cpf_auditing_assessments'
        ORDER BY ordinal_position;
      `);

      log('\n📊 Table structure:', colors.blue);
      tableInfo.rows.forEach(col => {
        log(`  - ${col.column_name} (${col.data_type})${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`, colors.reset);
      });

      // Check indices
      const indices = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'cpf_auditing_assessments';
      `);

      log('\n📇 Indices:', colors.blue);
      indices.rows.forEach(idx => {
        log(`  - ${idx.indexname}`, colors.reset);
      });
    }

    await client.end();
  } catch (error) {
    log(`\n✗ Error creating tables: ${error.message}`, colors.red);
    await client.end();
    throw error;
  }
}

/**
 * Main setup function
 */
async function main() {
  try {
    log('\n🚀 Starting CPF Auditing Database Setup...', colors.blue);
    log(`📍 Target: ${DB_HOST}:${DB_PORT}/${DB_NAME}`, colors.blue);

    await setupDatabase();
    await createTables();

    log('\n' + '='.repeat(50), colors.green);
    log('✅ CPF Auditing Database Setup Complete!', colors.green);
    log('='.repeat(50), colors.green);
    log('\n📝 Next steps:', colors.blue);
    log('  1. Run seed script to populate data: node scripts/seed-cpf-auditing.js', colors.reset);
    log('  2. Start the server: npm start', colors.reset);
    log('  3. Access the auditing dashboard from admin panel\n', colors.reset);

    process.exit(0);
  } catch (error) {
    log('\n❌ Setup failed!', colors.red);
    log(`Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run the setup
main();
