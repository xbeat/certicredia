/**
 * Database Migration Script
 * Run with: npm run db:migrate
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function runMigration() {
  console.log('🔄 Starting database migration...\n');

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    console.log('📋 Creating tables and indexes...');
    await pool.query(schema);

    console.log('✅ Migration completed successfully!\n');

    // Display tables created
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📊 Tables created:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
