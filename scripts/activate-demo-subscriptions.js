import { pool } from '../server/config/database.js';

/**
 * Activate subscriptions for all demo organizations
 */
async function activateDemoSubscriptions() {
  const client = await pool.connect();

  try {
    console.log('🔓 Activating subscriptions for demo organizations...\n');

    // Update all organizations to have active lifetime subscriptions
    const result = await client.query(`
      UPDATE organizations
      SET
        subscription_active = TRUE,
        subscription_type = 'lifetime',
        subscription_started_at = CURRENT_TIMESTAMP,
        subscription_expires_at = NULL
      WHERE subscription_active = FALSE OR subscription_active IS NULL
      RETURNING id, name, subscription_type;
    `);

    console.log(`✅ Activated ${result.rowCount} subscriptions:\n`);
    result.rows.forEach(org => {
      console.log(`   - [${org.id}] ${org.name} → ${org.subscription_type}`);
    });

    console.log('\n✅ All demo organizations now have active lifetime subscriptions!');
    console.log('   You can now access the dashboard without 402 errors.\n');

  } catch (error) {
    console.error('❌ Error activating subscriptions:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run activation
activateDemoSubscriptions()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
