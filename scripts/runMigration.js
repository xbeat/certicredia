import { Client } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connesso a Neon');

    // Read migration file
    const migrationSQL = readFileSync(
      join(__dirname, '../core/database/migrations/add_address_fields_to_users.sql'),
      'utf-8'
    );

    // Execute migration
    await client.query(migrationSQL);
    console.log('✅ Migration completata con successo!');

  } catch (error) {
    console.error('❌ Errore durante la migration:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
