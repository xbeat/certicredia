import { pool } from '../server/config/database.js';

/**
 * Comprehensive database health check
 */
async function checkDatabaseHealth() {
  const results = {
    connection: false,
    tables: {},
    errors: []
  };

  try {
    console.log('🏥 Running database health check...\n');

    // 1. Test connection
    console.log('1️⃣ Testing database connection...');
    try {
      const connectionTest = await pool.query('SELECT NOW() as current_time, version()');
      results.connection = true;
      console.log('   ✅ Connection successful');
      console.log(`   📅 Server time: ${connectionTest.rows[0].current_time}`);
      console.log(`   🗄️  Version: ${connectionTest.rows[0].version.split(',')[0]}`);
    } catch (error) {
      results.errors.push(`Connection failed: ${error.message}`);
      console.log(`   ❌ Connection failed: ${error.message}`);
      return results;
    }

    console.log('');

    // 2. Check required tables
    console.log('2️⃣ Checking required tables...');
    const requiredTables = [
      'users',
      'organizations',
      'cpf_auditing_assessments',
      'organization_users'
    ];

    for (const tableName of requiredTables) {
      try {
        const tableCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = $1
          );
        `, [tableName]);

        const exists = tableCheck.rows[0].exists;
        results.tables[tableName] = { exists, count: 0 };

        if (exists) {
          // Get row count
          const countResult = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
          results.tables[tableName].count = parseInt(countResult.rows[0].count);
          console.log(`   ✅ ${tableName}: EXISTS (${results.tables[tableName].count} rows)`);
        } else {
          console.log(`   ❌ ${tableName}: MISSING`);
          results.errors.push(`Table ${tableName} does not exist`);
        }
      } catch (error) {
        results.tables[tableName] = { exists: false, error: error.message };
        results.errors.push(`Error checking ${tableName}: ${error.message}`);
        console.log(`   ❌ ${tableName}: ERROR - ${error.message}`);
      }
    }

    console.log('');

    // 3. Check for organizations without assessments
    if (results.tables.organizations?.exists && results.tables.cpf_auditing_assessments?.exists) {
      console.log('3️⃣ Checking organizations vs assessments...');
      try {
        const orgsWithoutAssessment = await pool.query(`
          SELECT o.id, o.name, o.status
          FROM organizations o
          LEFT JOIN cpf_auditing_assessments a ON o.id = a.organization_id AND a.deleted_at IS NULL
          WHERE a.id IS NULL
          LIMIT 10
        `);

        if (orgsWithoutAssessment.rows.length === 0) {
          console.log('   ✅ All organizations have assessments');
        } else {
          console.log(`   ⚠️  ${orgsWithoutAssessment.rows.length} organizations without assessments:`);
          orgsWithoutAssessment.rows.forEach(org => {
            console.log(`      - ID ${org.id}: ${org.name} (${org.status})`);
          });
        }
      } catch (error) {
        console.log(`   ❌ Error checking organizations: ${error.message}`);
      }
    }

    console.log('');

    // 4. Summary
    console.log('📋 SUMMARY');
    console.log('==================');
    if (results.errors.length === 0) {
      console.log('✅ All checks passed! Database is healthy.');
    } else {
      console.log(`❌ Found ${results.errors.length} issue(s):`);
      results.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }

    return results;

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error('Stack:', error.stack);
    results.errors.push(`Fatal error: ${error.message}`);
    return results;
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkDatabaseHealth()
    .then((results) => {
      console.log('');
      if (results.errors.length > 0) {
        console.log('💡 To fix missing tables, run:');
        console.log('   node scripts/setup-database.js');
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error.message);
      process.exit(1);
    });
}

export default checkDatabaseHealth;
