import { pool } from '../server/config/database.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  const client = await pool.connect();

  try {
    console.log('🔧 Initializing database schema...\n');

    // Read base schema
    const baseSchemaPath = path.join(__dirname, '../core/database/schema/base_schema.sql');
    const baseSchema = await fs.readFile(baseSchemaPath, 'utf-8');

    console.log('📊 Executing base schema (ecommerce tables)...');
    await client.query(baseSchema);
    console.log('✅ Base schema executed successfully\n');

    // Read accreditation schema
    const accSchemaPath = path.join(__dirname, '../core/database/schema/accreditation_schema.sql');
    const accSchema = await fs.readFile(accSchemaPath, 'utf-8');

    console.log('📊 Executing accreditation schema...');
    await client.query(accSchema);
    console.log('✅ Accreditation schema executed successfully\n');

    console.log('🎉 Database initialization completed!\n');
    console.log('Now you can run: node scripts/seedSimpleDemo.js');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    console.error('\nDetails:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run initialization
initDatabase()
  .then(() => {
    console.log('✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
