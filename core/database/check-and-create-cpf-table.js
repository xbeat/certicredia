import { pool } from '../../server/config/database.js';
import fs from 'fs/promises';
import logger from '../../server/utils/logger.js';

/**
 * Check if cpf_auditing_assessments table exists and create it if missing
 */
async function checkAndCreateCPFTable() {
  try {
    console.log('🔍 Checking if cpf_auditing_assessments table exists...');

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'cpf_auditing_assessments'
      );
    `);

    const tableExists = tableCheck.rows[0].exists;

    if (tableExists) {
      console.log('✅ cpf_auditing_assessments table already exists');

      // Check if table has data
      const countResult = await pool.query('SELECT COUNT(*) FROM cpf_auditing_assessments');
      console.log(`📊 Table has ${countResult.rows[0].count} records`);

      return { exists: true, created: false };
    }

    console.log('⚠️  cpf_auditing_assessments table does NOT exist');
    console.log('📝 Creating cpf_auditing_assessments table...');

    // Read schema file
    const schemaSQL = await fs.readFile('./core/database/schema/cpf_auditing_schema.sql', 'utf8');

    // Execute schema
    await pool.query(schemaSQL);

    console.log('✅ cpf_auditing_assessments table created successfully!');

    return { exists: false, created: true };

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkAndCreateCPFTable()
    .then((result) => {
      if (result.created) {
        console.log('\n✅ Setup complete! The cpf_auditing_assessments table is now ready.');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Setup failed:', error.message);
      process.exit(1);
    });
}

export default checkAndCreateCPFTable;
