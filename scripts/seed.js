/**
 * Database Seed Script
 * Run with: npm run db:seed
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function runSeed() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Read seed file
    const seedPath = path.join(__dirname, '../database/seed.sql');
    const seed = fs.readFileSync(seedPath, 'utf8');

    // Execute seed
    console.log('📦 Inserting sample data...');
    await pool.query(seed);

    console.log('✅ Seeding completed successfully!\n');

    // Display seeded data summary
    const products = await pool.query('SELECT COUNT(*) FROM products');
    const users = await pool.query('SELECT COUNT(*) FROM users');

    console.log('📊 Data seeded:');
    console.log(`   - Products: ${products.rows[0].count}`);
    console.log(`   - Users: ${users.rows[0].count}`);
    console.log('\n⚠️  Remember to change the default admin password!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runSeed();
