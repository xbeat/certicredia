import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const SALT_ROUNDS = 10;

async function seedDemoUsers() {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'certicredia',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  });

  try {
    await client.connect();
    console.log('📦 Connected to database');

    const testUsers = [
      { email: 'admin@certicredia.test', password: 'Admin123!@#', name: 'Admin System', role: 'admin', company: 'CertiCredia' },
      { email: 'user@certicredia.test', password: 'User123!@#', name: 'Mario Rossi', role: 'user', company: 'Acme Corp' },
      { email: 'specialist@certicredia.test', password: 'Specialist123!@#', name: 'Giulia Verdi', role: 'specialist', company: null },
      { email: 'organization@certicredia.test', password: 'Org123!@#', name: 'Paolo Bianchi', role: 'organization_admin', company: 'Enterprise SRL' }
    ];

    console.log('👥 Creating demo users...');

    for (const userData of testUsers) {
      const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);

      const result = await client.query(
        `INSERT INTO users (email, password_hash, name, role, company, active, email_verified)
         VALUES ($1, $2, $3, $4, $5, true, true)
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           name = EXCLUDED.name,
           role = EXCLUDED.role,
           company = EXCLUDED.company,
           active = EXCLUDED.active,
           email_verified = EXCLUDED.email_verified
         RETURNING id`,
        [userData.email, passwordHash, userData.name, userData.role, userData.company]
      );

      console.log(`✅ Created/Updated: ${userData.email} (${userData.role})`);
    }

    console.log('\n🎉 Demo users created successfully!');
    console.log('\n📝 Login credentials:');
    testUsers.forEach(user => {
      console.log(`   ${user.email} / ${user.password}`);
    });

  } catch (error) {
    console.error('❌ Error seeding demo users:', error);
    throw error;
  } finally {
    await client.end();
  }
}

seedDemoUsers().catch(console.error);
