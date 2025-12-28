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
      // Check if organization already exists
      const existingOrg = await client.query(
        'SELECT id FROM organizations WHERE email = $1',
        [org.email]
      );

      let orgId;
      if (existingOrg.rows.length > 0) {
        orgId = existingOrg.rows[0].id;
        console.log(`ℹ️  Organization already exists: ${org.name} (ID: ${orgId})`);
      } else {
        const result = await client.query(
          `INSERT INTO organizations (name, organization_type, vat_number, email, city, address, postal_code, country, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
           RETURNING id`,
          [org.name, org.type, org.vat, org.email, org.city, 'Via Demo 123', '00100', 'Italia']
        );
        orgId = result.rows[0].id;
        console.log(`✅ Created organization: ${org.name} (ID: ${orgId})`);
      }
      orgIds.push(orgId);
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

      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [spec.email]
      );

      let userId;
      if (existingUser.rows.length > 0) {
        userId = existingUser.rows[0].id;
        // Update existing user
        await client.query(
          `UPDATE users SET name = $1, role = 'specialist', active = true, email_verified = true WHERE id = $2`,
          [spec.name, userId]
        );
        console.log(`ℹ️  User already exists, updated: ${spec.name} (User ID: ${userId})`);
      } else {
        // Create new user
        const userResult = await client.query(
          `INSERT INTO users (email, password_hash, name, role, active, email_verified)
           VALUES ($1, $2, $3, 'specialist', true, true)
           RETURNING id`,
          [spec.email, passwordHash, spec.name]
        );
        userId = userResult.rows[0].id;
        console.log(`✅ Created user: ${spec.name} (User ID: ${userId})`);
      }

      // Create or update specialist profile
      const existingSpec = await client.query(
        'SELECT id FROM specialist_profiles WHERE user_id = $1',
        [userId]
      );

      if (existingSpec.rows.length > 0) {
        await client.query(
          `UPDATE specialist_profiles
           SET experience_years = $1,
               bio = $2,
               status = 'active',
               exam_passed = true,
               exam_score = 95.00,
               cpe_hours_current_year = $3
           WHERE user_id = $4`,
          [spec.experience, spec.bio, spec.experience * 10, userId]
        );
      } else {
        await client.query(
          `INSERT INTO specialist_profiles (
            user_id,
            experience_years,
            bio,
            status,
            exam_passed,
            exam_score,
            exam_passed_at,
            cpe_hours_current_year
          )
          VALUES ($1, $2, $3, 'active', true, 95.00, CURRENT_TIMESTAMP, $4)`,
          [userId, spec.experience, spec.bio, spec.experience * 10]
        );
      }

      specialistIds.push(userId);
    }

    // Step 3: Create demo assessment template if needed
    console.log('\n📝 Creating assessment template...');

    let templateId;
    const existingTemplate = await client.query(
      `SELECT id FROM assessment_templates WHERE version = $1`,
      ['v1.0-demo']
    );

    if (existingTemplate.rows.length > 0) {
      templateId = existingTemplate.rows[0].id;
      console.log(`ℹ️  Template already exists (ID: ${templateId})`);
    } else {
      const templateResult = await client.query(
        `INSERT INTO assessment_templates (
          version,
          name,
          description,
          structure,
          status,
          active
        )
        VALUES ($1, $2, $3, $4, 'active', true)
        RETURNING id`,
        [
          'v1.0-demo',
          'Assessment Cybersecurity Standard v1.0',
          'Template standard per la valutazione della sicurezza informatica delle organizzazioni',
          JSON.stringify({
            sections: [
              { id: 1, title: 'Governance', questions: 10 },
              { id: 2, title: 'Risk Management', questions: 15 },
              { id: 3, title: 'Technical Controls', questions: 20 }
            ]
          })
        ]
      );
      templateId = templateResult.rows[0].id;
      console.log(`✅ Created template (ID: ${templateId})`);
    }

    // Step 4: Create demo assessments for organizations
    console.log('\n📋 Creating demo assessments...');
    const assessmentIds = [];

    for (let i = 0; i < orgIds.length; i++) {
      const orgId = orgIds[i];
      const orgName = organizations[i].name;

      // Check if assessment already exists for this organization
      const existingAssessment = await client.query(
        `SELECT id FROM assessments WHERE organization_id = $1 AND status = 'in_progress' LIMIT 1`,
        [orgId]
      );

      let assessmentId;
      if (existingAssessment.rows.length > 0) {
        assessmentId = existingAssessment.rows[0].id;
        console.log(`ℹ️  Assessment already exists for ${orgName} (Assessment ID: ${assessmentId})`);
      } else {
        const assessmentResult = await client.query(
          `INSERT INTO assessments (
            organization_id,
            template_id,
            status
          )
          VALUES ($1, $2, 'in_progress')
          RETURNING id`,
          [orgId, templateId]
        );
        assessmentId = assessmentResult.rows[0].id;
        console.log(`✅ Created assessment for ${orgName} (Assessment ID: ${assessmentId})`);
      }

      assessmentIds.push({
        id: assessmentId,
        orgId: orgId,
        orgName: orgName
      });
    }

    // Step 5: Create specialist assignments
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

        // Check if assignment already exists
        const existingAssignment = await client.query(
          `SELECT id FROM specialist_assignments
           WHERE assessment_id = $1 AND specialist_id = $2`,
          [assessment.id, specialistId]
        );

        if (existingAssignment.rows.length === 0) {
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
              VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP + INTERVAL '90 days')`,
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
            console.log(`✅ Assigned specialist #${specialistId} to ${assessment.orgName} (Status: ${i === 0 ? 'accepted' : 'pending'})`);
          } catch (error) {
            console.warn(`⚠️  Warning assigning specialist to ${assessment.orgName}:`, error.message);
          }
        } else {
          console.log(`ℹ️  Specialist #${specialistId} already assigned to ${assessment.orgName}`);
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
