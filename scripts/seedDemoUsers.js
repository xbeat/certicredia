import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const SALT_ROUNDS = 10;

async function seedDemoUsers() {
  const client = new Client(
    process.env.DATABASE_URL || {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'certicredia',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    }
  );

  try {
    await client.connect();
    console.log('📦 Connected to database');

    const testUsers = [
      {
        email: 'admin@certicredia.test',
        password: 'Admin123!@#',
        name: 'Admin System',
        role: 'admin',
        company: 'CertiCredia',
        vat_number: 'IT01234567890',
        phone: '+39 06 1234567',
        address: 'Via Roma 123',
        city: 'Roma',
        postal_code: '00100',
        country: 'Italia'
      },
      {
        email: 'user@certicredia.test',
        password: 'User123!@#',
        name: 'Mario Rossi',
        role: 'user',
        company: 'Acme Corp',
        vat_number: 'IT98765432109',
        phone: '+39 02 9876543',
        address: 'Corso Vittorio Emanuele 45',
        city: 'Milano',
        postal_code: '20121',
        country: 'Italia'
      },
      {
        email: 'specialist@certicredia.test',
        password: 'Specialist123!@#',
        name: 'Giulia Verdi',
        role: 'specialist',
        company: 'Verdi Consulting',
        vat_number: 'IT12345678901',
        phone: '+39 051 7654321',
        address: 'Via Indipendenza 78',
        city: 'Bologna',
        postal_code: '40121',
        country: 'Italia'
      },
      {
        email: 'organization@certicredia.test',
        password: 'Org123!@#',
        name: 'Paolo Bianchi',
        role: 'organization_admin',
        company: 'Enterprise SRL',
        vat_number: 'IT55667788990',
        phone: '+39 011 5556677',
        address: 'Via Po 234',
        city: 'Torino',
        postal_code: '10124',
        country: 'Italia'
      }
    ];

    console.log('👥 Creating demo users...');

    for (const userData of testUsers) {
      const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);

      const result = await client.query(
        `INSERT INTO users (email, password_hash, name, role, company, vat_number, phone, address, city, postal_code, country, active, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, true)
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           name = EXCLUDED.name,
           role = EXCLUDED.role,
           company = EXCLUDED.company,
           vat_number = EXCLUDED.vat_number,
           phone = EXCLUDED.phone,
           address = EXCLUDED.address,
           city = EXCLUDED.city,
           postal_code = EXCLUDED.postal_code,
           country = EXCLUDED.country,
           active = EXCLUDED.active,
           email_verified = EXCLUDED.email_verified
         RETURNING id`,
        [
          userData.email,
          passwordHash,
          userData.name,
          userData.role,
          userData.company,
          userData.vat_number,
          userData.phone,
          userData.address,
          userData.city,
          userData.postal_code,
          userData.country
        ]
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
