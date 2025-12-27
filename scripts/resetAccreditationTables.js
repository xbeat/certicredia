import { pool } from '../server/config/database.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resetAccreditationTables() {
  const client = await pool.connect();

  try {
    console.log('🔧 Resetting accreditation tables...\n');

    await client.query('BEGIN');

    // Drop all accreditation tables in correct order (reverse dependencies)
    console.log('🗑️  Dropping existing accreditation tables...');

    const dropTables = [
      'audit_logs',
      'evidence_files',
      'review_comments',
      'specialist_assignments',
      'assessments',
      'assessment_templates',
      'specialist_cpe_records',
      'specialist_exam_attempts',
      'specialist_exam_questions',
      'specialist_profiles',
      'organization_users',
      'organizations',
      'mfa_secrets',
      'password_reset_tokens'
    ];

    for (const table of dropTables) {
      await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`   ✅ Dropped ${table}`);
    }

    await client.query('COMMIT');

    console.log('\n✅ All accreditation tables dropped!\n');

    // Now execute the accreditation schema
    console.log('📊 Creating fresh accreditation schema...');

    const accSchemaPath = path.join(__dirname, '../core/database/schema/accreditation_schema.sql');
    const accSchema = await fs.readFile(accSchemaPath, 'utf-8');

    await client.query(accSchema);

    console.log('✅ Accreditation schema created successfully!\n');

    console.log('🎉 Database reset completed!\n');
    console.log('Now run: node scripts/seedSimpleDemo.js');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error resetting database:', error);
    console.error('\nDetails:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run reset
resetAccreditationTables()
  .then(() => {
    console.log('✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
