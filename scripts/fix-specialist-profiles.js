/**
 * Fix Specialist Profiles Script
 *
 * This script automatically creates missing specialist_profile entries
 * for users with role='specialist' who don't have a profile.
 *
 * This fixes the "Specialist profile not found" error that occurs when
 * a specialist user tries to access their dashboard.
 *
 * Usage: node scripts/fix-specialist-profiles.js
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function fixSpecialistProfiles() {
  log('\n🔧 Fix Specialist Profiles Script', colors.blue);
  log('═'.repeat(80), colors.blue);

  // Database configuration
  let clientConfig;
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    clientConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1),
      user: url.username,
      password: url.password,
      ssl: url.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : false
    };
  } else {
    clientConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'certicredia',
      user: process.env.DB_USER || 'certicredia_user',
      password: process.env.DB_PASSWORD || 'your_secure_password_here'
    };
  }

  const client = new pg.Client(clientConfig);

  try {
    await client.connect();
    log('\n✓ Connesso al database', colors.green);

    // Find orphaned specialists (users without profiles)
    log('\n🔍 Ricerca specialist senza profile...', colors.yellow);

    const orphanedResult = await client.query(
      `SELECT u.id, u.email, u.name, u.role, u.created_at
       FROM users u
       WHERE u.role = 'specialist'
       AND NOT EXISTS (
         SELECT 1 FROM specialist_profiles sp WHERE sp.user_id = u.id
       )
       ORDER BY u.id`
    );

    if (orphanedResult.rows.length === 0) {
      log('\n✅ Nessun specialist senza profile trovato!', colors.green);
      log('Tutti gli specialist hanno già un profile associato.\n', colors.green);
      await client.end();
      return;
    }

    log(`\n📊 Trovati ${orphanedResult.rows.length} specialist senza profile`, colors.yellow);
    log('─'.repeat(80), colors.cyan);

    let created = 0;
    let errors = 0;

    for (const user of orphanedResult.rows) {
      log(`\n📝 Creazione profile per: ${user.email} (ID: ${user.id})`, colors.yellow);

      await client.query('BEGIN');

      try {
        // Create specialist profile with default values
        const profileResult = await client.query(
          `INSERT INTO specialist_profiles
           (user_id, status, exam_attempts, exam_passed, experience_years, cpe_hours_current_year, cpe_hours_total, cpe_compliant, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING id`,
          [
            user.id,
            'candidate', // Default status
            0, // No exam attempts yet
            false, // Exam not passed
            0, // No experience recorded
            0, // No CPE hours
            0, // No total CPE hours
            true // CPE compliant by default
          ]
        );

        const profileId = profileResult.rows[0].id;

        await client.query('COMMIT');

        log(`  ✅ Profile creato con successo (ID: ${profileId})`, colors.green);
        log(`     Status: candidate (può essere aggiornato dall'admin)`, colors.cyan);
        created++;

      } catch (error) {
        await client.query('ROLLBACK');
        log(`  ❌ Errore per ${user.email}: ${error.message}`, colors.red);
        errors++;
      }
    }

    log('\n' + '═'.repeat(80), colors.green);
    log('✅ Fix Completato!', colors.green);
    log(`   ✓ Profiles creati: ${created}`, colors.green);
    if (errors > 0) {
      log(`   ✗ Errori: ${errors}`, colors.red);
    }
    log('═'.repeat(80), colors.green);

    // Show final statistics
    const stats = await client.query(
      `SELECT
         COUNT(*) as total_specialists,
         COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
         COUNT(CASE WHEN status = 'candidate' THEN 1 END) as candidates,
         COUNT(CASE WHEN status = 'exam_pending' THEN 1 END) as exam_pending,
         COUNT(CASE WHEN exam_passed = true THEN 1 END) as exam_passed
       FROM specialist_profiles`
    );

    const s = stats.rows[0];

    log('\n📊 Statistiche Finali:', colors.blue);
    log(`   Total Specialist Profiles: ${s.total_specialists}`, colors.reset);
    log(`   Active: ${s.active}`, colors.green);
    log(`   Candidates: ${s.candidates}`, colors.yellow);
    log(`   Exam Pending: ${s.exam_pending}`, colors.cyan);
    log(`   Exam Passed: ${s.exam_passed}`, colors.green);

    log('\n📝 Prossimi passi:', colors.blue);
    log('  1. Gli specialist possono ora accedere alla dashboard', colors.reset);
    log('  2. L\'admin può aggiornare lo status da \'candidate\' ad \'active\' se necessario', colors.reset);
    log('  3. Gli specialist possono completare il loro profilo con qualifiche e CV\n', colors.reset);

    await client.end();

  } catch (error) {
    log(`\n✗ Errore: ${error.message}`, colors.red);
    console.error(error);
    await client.end();
    process.exit(1);
  }
}

// Run the fix
fixSpecialistProfiles();
