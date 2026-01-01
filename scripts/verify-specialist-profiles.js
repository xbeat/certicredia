/**
 * Verify Specialist Profiles Script
 *
 * This script checks for specialists in the system that don't have
 * a corresponding specialist_profile entry, which causes the
 * "Specialist profile not found" error.
 *
 * Usage: node scripts/verify-specialist-profiles.js
 */

import { pool } from '../server/config/database.js';
import logger from '../server/utils/logger.js';

async function verifySpecialistProfiles() {
  const client = await pool.connect();

  try {
    console.log('\n🔍 Verificando specialist profiles...\n');

    // Get all specialist users
    const usersResult = await client.query(
      `SELECT id, email, name, role
       FROM users
       WHERE role = 'specialist'
       ORDER BY id`
    );

    console.log(`📊 Trovati ${usersResult.rows.length} utenti con ruolo 'specialist'\n`);

    if (usersResult.rows.length === 0) {
      console.log('✅ Nessun utente specialist nel sistema\n');
      return;
    }

    // Get all specialist profiles
    const profilesResult = await client.query(
      `SELECT sp.id, sp.user_id, sp.status, u.email, u.name
       FROM specialist_profiles sp
       JOIN users u ON sp.user_id = u.id
       ORDER BY sp.id`
    );

    console.log(`📋 Trovati ${profilesResult.rows.length} specialist profiles\n`);

    // Check for orphaned specialists (users without profiles)
    const orphanedResult = await client.query(
      `SELECT u.id, u.email, u.name, u.role, u.created_at
       FROM users u
       WHERE u.role = 'specialist'
       AND NOT EXISTS (
         SELECT 1 FROM specialist_profiles sp WHERE sp.user_id = u.id
       )
       ORDER BY u.id`
    );

    if (orphanedResult.rows.length > 0) {
      console.log(`\n\n⚠️  UTENTI SPECIALIST SENZA PROFILE (${orphanedResult.rows.length}):`);
      console.log('─'.repeat(80));
      orphanedResult.rows.forEach(user => {
        const createdDate = new Date(user.created_at).toISOString().split('T')[0];
        console.log(`❌ ${user.email.padEnd(35)} (ID: ${String(user.id).padStart(3)}) - ${user.name}`);
        console.log(`   Created: ${createdDate}`);
      });
      console.log('─'.repeat(80));

      console.log(`\n\n💡 SOLUZIONE:`);
      console.log(`   Esegui: node scripts/fix-specialist-profiles.js`);
      console.log(`   Questo creerà automaticamente i profile mancanti\n`);
    } else {
      console.log('\n✅ TUTTO OK! Tutti gli specialist hanno un profile associato\n');
    }

    // Show existing profiles summary
    if (profilesResult.rows.length > 0) {
      console.log('\n📋 SPECIALIST PROFILES ESISTENTI:');
      console.log('─'.repeat(80));
      profilesResult.rows.forEach(profile => {
        const statusEmoji = {
          'candidate': '📝',
          'exam_pending': '⏳',
          'active': '✅',
          'suspended': '🔴',
          'inactive': '⚫'
        }[profile.status] || '❓';

        console.log(`${statusEmoji} ${profile.email.padEnd(35)} - ${profile.status.padEnd(15)} (Profile ID: ${profile.id})`);
      });
      console.log('─'.repeat(80));
    }

  } catch (error) {
    logger.error('Errore verifica:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run verification
verifySpecialistProfiles()
  .then(() => {
    console.log('\n✅ Verifica completata\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Errore durante la verifica:\n', err.message);
    process.exit(1);
  });
