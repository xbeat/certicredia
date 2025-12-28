import pg from 'pg';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const SALT_ROUNDS = 10;

/**
 * Seed script to create specialist assignments
 * Links specialists to organizations through assessments
 */

async function seedSpecialistAssignments() {
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

    // Step 1: Create demo organizations if they don't exist
    console.log('\n🏢 Creating demo organizations...');
    const organizations = [
      {
        name: 'Comune di Milano',
        type: 'PUBLIC_ENTITY',
        vat: 'IT01199250158',
        email: 'protocollo@comune.milano.it',
        city: 'Milano'
      },
      {
        name: 'Acme Corporation S.r.l.',
        type: 'PRIVATE_COMPANY',
        vat: 'IT12345678901',
        email: 'info@acmecorp.it',
        city: 'Roma'
      },
      {
        name: 'TechSolutions S.p.A.',
        type: 'PRIVATE_COMPANY',
        vat: 'IT98765432109',
        email: 'contact@techsolutions.it',
        city: 'Torino'
      },
      {
        name: 'Fondazione NoProfit Italia',
        type: 'NON_PROFIT',
        vat: 'IT11223344556',
        email: 'info@fondazionenonprofit.it',
        city: 'Firenze'
      }
    ];

    const orgIds = [];
    for (const org of organizations) {
      const result = await client.query(
        `INSERT INTO organizations (name, organization_type, vat_number, email, city, address, postal_code, country, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           organization_type = EXCLUDED.organization_type
         RETURNING id`,
        [org.name, org.type, org.vat, org.email, org.city, 'Via Demo 123', '00100', 'Italia']
      );
      orgIds.push(result.rows[0].id);
      console.log(`✅ Created/Updated organization: ${org.name} (ID: ${result.rows[0].id})`);
    }

    // Step 2: Create demo specialist users if they don't exist
    console.log('\n👨‍💼 Creating demo specialists...');
    const specialists = [
      {
        email: 'marco.bianchi@specialist.test',
        password: 'Specialist123!@#',
        name: 'Marco Bianchi',
        experience: 8,
        bio: 'CISSP, CISM - 8 anni esperienza in penetration testing e security audit'
      },
      {
        email: 'laura.ferrari@specialist.test',
        password: 'Specialist123!@#',
        name: 'Laura Ferrari',
        experience: 5,
        bio: 'CEH, OSCP - Specializzata in vulnerability assessment e threat modeling'
      },
      {
        email: 'giovanni.russo@specialist.test',
        password: 'Specialist123!@#',
        name: 'Giovanni Russo',
        experience: 12,
        bio: 'CISA, ISO 27001 Lead Auditor - Esperto in compliance e risk management'
      },
      {
        email: 'sofia.colombo@specialist.test',
        password: 'Specialist123!@#',
        name: 'Sofia Colombo',
        experience: 6,
        bio: 'Security+, GIAC GSEC - Focus su cloud security e DevSecOps'
      }
    ];

    const specialistIds = [];
    for (const spec of specialists) {
      const passwordHash = await bcrypt.hash(spec.password, SALT_ROUNDS);

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, name, role, active, email_verified)
         VALUES ($1, $2, $3, 'specialist', true, true)
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           role = 'specialist',
           active = true
         RETURNING id`,
        [spec.email, passwordHash, spec.name]
      );
      const userId = userResult.rows[0].id;

      // Create specialist profile
      await client.query(
        `INSERT INTO specialists (user_id, experience_years, bio, certification_status, total_cpe_credits)
         VALUES ($1, $2, $3, 'certified', $4)
         ON CONFLICT (user_id) DO UPDATE SET
           experience_years = EXCLUDED.experience_years,
           bio = EXCLUDED.bio,
           certification_status = 'certified'`,
        [userId, spec.experience, spec.bio, spec.experience * 10]
      );

      specialistIds.push(userId);
      console.log(`✅ Created/Updated specialist: ${spec.name} (User ID: ${userId})`);
    }

    // Step 3: Create demo assessments for organizations
    console.log('\n📋 Creating demo assessments...');
    const assessmentIds = [];

    for (let i = 0; i < orgIds.length; i++) {
      const orgId = orgIds[i];
      const orgName = organizations[i].name;

      const assessmentResult = await client.query(
        `INSERT INTO assessments (
          organization_id,
          assessment_type,
          status,
          start_date,
          target_completion_date,
          scope_description
         )
         VALUES ($1, 'full', 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days', $2)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [orgId, `Assessment cybersecurity completo per ${orgName}`]
      );

      if (assessmentResult.rows.length > 0) {
        assessmentIds.push({
          id: assessmentResult.rows[0].id,
          orgId: orgId,
          orgName: orgName
        });
        console.log(`✅ Created assessment for ${orgName} (Assessment ID: ${assessmentResult.rows[0].id})`);
      }
    }

    // Step 4: Create specialist assignments
    console.log('\n🔗 Creating specialist assignments...');

    let assignmentCount = 0;

    for (const assessment of assessmentIds) {
      // Assign 1-2 specialists to each organization/assessment
      const numSpecialists = Math.floor(Math.random() * 2) + 1; // 1 or 2 specialists

      for (let i = 0; i < numSpecialists; i++) {
        const specialistId = specialistIds[Math.floor(Math.random() * specialistIds.length)];

        // Generate access token
        const accessToken = crypto.randomBytes(16).toString('hex');
        const tokenHash = await bcrypt.hash(accessToken, SALT_ROUNDS);

        // Create assignment
        try {
          await client.query(
            `INSERT INTO specialist_assignments (
              assessment_id,
              organization_id,
              specialist_id,
              access_token,
              token_hash,
              status,
              expires_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP + INTERVAL '90 days')
            ON CONFLICT (access_token) DO NOTHING`,
            [
              assessment.id,
              assessment.orgId,
              specialistId,
              accessToken,
              tokenHash,
              i === 0 ? 'accepted' : 'pending' // First specialist is accepted, others pending
            ]
          );

          assignmentCount++;

          const specName = specialists.find(s => {
            // Find specialist name by matching user ID
            return true; // Simplified for demo
          })?.name || 'Specialist';

          console.log(`✅ Assigned specialist #${specialistId} to ${assessment.orgName} (Status: ${i === 0 ? 'accepted' : 'pending'})`);
        } catch (error) {
          // Skip if duplicate
          if (!error.message.includes('duplicate')) {
            console.warn(`⚠️  Warning assigning specialist to ${assessment.orgName}:`, error.message);
          }
        }
      }
    }

    console.log(`\n🎉 Specialist assignments seed completed!`);
    console.log(`\n📊 Summary:`);
    console.log(`   Organizations: ${orgIds.length}`);
    console.log(`   Specialists: ${specialistIds.length}`);
    console.log(`   Assessments: ${assessmentIds.length}`);
    console.log(`   Assignments: ${assignmentCount}`);

    console.log(`\n🔐 Demo Specialist Credentials:`);
    specialists.forEach(spec => {
      console.log(`   ${spec.email} / ${spec.password}`);
    });

  } catch (error) {
    console.error('❌ Error seeding specialist assignments:', error);
    throw error;
  } finally {
    await client.end();
  }
}

seedSpecialistAssignments().catch(console.error);
