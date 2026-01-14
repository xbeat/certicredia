import { pool } from '../server/config/database.js';

async function checkOrganizations() {
  try {
    console.log('🔍 Checking organizations table...\n');

    // Check if subscription columns exist
    const columnsCheck = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'organizations'
      AND column_name LIKE 'subscription%'
      ORDER BY column_name;
    `);

    console.log('📋 Subscription columns:');
    if (columnsCheck.rows.length === 0) {
      console.log('   ❌ NO SUBSCRIPTION COLUMNS FOUND!');
      console.log('   The schema was not updated correctly.\n');
    } else {
      columnsCheck.rows.forEach(col => {
        console.log(`   ✅ ${col.column_name} (${col.data_type}) - default: ${col.column_default || 'none'}`);
      });
      console.log('');
    }

    // Check organization 1
    const org1 = await pool.query(`
      SELECT id, name, status, subscription_active, subscription_type, subscription_started_at
      FROM organizations
      WHERE id = 1;
    `);

    if (org1.rows.length === 0) {
      console.log('❌ Organization ID 1 not found!\n');
    } else {
      const org = org1.rows[0];
      console.log('🏢 Organization 1:');
      console.log(`   ID: ${org.id}`);
      console.log(`   Name: ${org.name}`);
      console.log(`   Status: ${org.status}`);
      console.log(`   Subscription Active: ${org.subscription_active} ${org.subscription_active ? '✅' : '❌'}`);
      console.log(`   Subscription Type: ${org.subscription_type || 'null'}`);
      console.log(`   Started At: ${org.subscription_started_at || 'null'}`);
      console.log('');

      if (!org.subscription_active) {
        console.log('⚠️  PROBLEM FOUND: subscription_active is FALSE!');
        console.log('   This is why you get 402 Payment Required.\n');
        console.log('💡 FIX: Run this SQL command:');
        console.log('   UPDATE organizations SET subscription_active = TRUE, subscription_type = \'lifetime\', subscription_started_at = CURRENT_TIMESTAMP WHERE id = 1;\n');
      } else {
        console.log('✅ Subscription is active! Should work.\n');
      }
    }

    // Check all organizations
    const allOrgs = await pool.query(`
      SELECT id, name, subscription_active, subscription_type
      FROM organizations
      ORDER BY id;
    `);

    console.log('📊 All organizations:');
    allOrgs.rows.forEach(org => {
      const status = org.subscription_active ? '✅' : '❌';
      console.log(`   ${status} [${org.id}] ${org.name} - ${org.subscription_type || 'null'} - active: ${org.subscription_active}`);
    });

    console.log('');

    // Count by subscription status
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE subscription_active = TRUE) as active,
        COUNT(*) FILTER (WHERE subscription_active = FALSE) as inactive
      FROM organizations;
    `);

    const s = stats.rows[0];
    console.log('📈 Stats:');
    console.log(`   Total: ${s.total}`);
    console.log(`   Active: ${s.active} ✅`);
    console.log(`   Inactive: ${s.inactive} ❌`);

    await pool.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

checkOrganizations();
