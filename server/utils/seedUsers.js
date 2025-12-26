import bcrypt from 'bcrypt';
import { pool } from '../config/database.js';
import logger from './logger.js';

/**
 * Seed Users - Create test users for each role
 *
 * Creates 4 test users:
 * 1. Admin user
 * 2. Ente/Organization admin
 * 3. Specialist
 * 4. Candidate specialist
 */

const SALT_ROUNDS = 12;

const TEST_USERS = [
  {
    name: 'Admin System',
    email: 'admin@certicredia.test',
    password: 'Admin123!@#',
    role: 'admin',
    company: 'CertiCredia',
    description: 'Admin con accesso completo al sistema'
  },
  {
    name: 'Mario Rossi',
    email: 'ente@certicredia.test',
    password: 'Ente123!@#',
    role: 'organization_admin',
    company: 'Acme Corp',
    description: 'Amministratore di organizzazione'
  },
  {
    name: 'Giulia Verdi',
    email: 'specialist@certicredia.test',
    password: 'Specialist123!@#',
    role: 'specialist',
    company: null,
    description: 'Specialist certificato attivo'
  },
  {
    name: 'Luca Bianchi',
    email: 'candidate@certicredia.test',
    password: 'Candidate123!@#',
    role: 'specialist',
    company: null,
    description: 'Specialist candidato (non ancora certificato)'
  }
];

async function seedUsers() {
  const client = await pool.connect();

  try {
    logger.info('🌱 Starting user seed...');

    // Start transaction
    await client.query('BEGIN');

    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of TEST_USERS) {
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id, email FROM users WHERE email = $1',
        [userData.email]
      );

      if (existingUser.rows.length > 0) {
        logger.warn(`⚠️  User already exists: ${userData.email}`);
        skippedCount++;
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

      // Insert user
      const result = await client.query(
        `INSERT INTO users (name, email, password_hash, company, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, role`,
        [userData.name, userData.email, hashedPassword, userData.company, userData.role]
      );

      const user = result.rows[0];
      logger.success(`✅ Created user: ${userData.email} (${userData.role}) - ID: ${user.id}`);
      createdCount++;

      // If specialist, create specialist profile
      if (userData.role === 'specialist') {
        await client.query(
          `INSERT INTO specialist_profiles (user_id, status, exam_passed, exam_score, cpe_hours_current_year)
           VALUES ($1, 'active', true, 95.50, 0)`,
          [user.id]
        );
        logger.info(`   └─ Created specialist profile (active, passed exam)`);
      } else if (userData.role === 'candidate_specialist') {
        await client.query(
          `INSERT INTO specialist_profiles (user_id, status, exam_passed)
           VALUES ($1, 'candidate', false)`,
          [user.id]
        );
        logger.info(`   └─ Created specialist profile (candidate)`);
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    logger.success(`\n✅ Seed completed!`);
    logger.info(`   Created: ${createdCount} users`);
    logger.info(`   Skipped: ${skippedCount} users (already exist)`);

    // Print credentials
    console.log('\n📋 TEST CREDENTIALS:\n');
    TEST_USERS.forEach(user => {
      console.log(`${user.description}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Role: ${user.role}`);
      console.log('');
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Seed failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seed
seedUsers()
  .then(() => {
    logger.success('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('💥 Fatal error:', error);
    process.exit(1);
  });
