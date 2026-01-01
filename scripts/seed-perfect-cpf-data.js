/**
 * Seed Perfect CPF Auditing Data
 *
 * Uses the Field Kit-based generator to create realistic, high-quality
 * CPF assessment data for the 5 demo organizations and writes it to PostgreSQL.
 *
 * Usage: node scripts/seed-perfect-cpf-data.js
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { generateOrganization } = require('./generate_demo_auditing_organizations.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const {
  DB_HOST = 'localhost',
  DB_PORT = 5432,
  DB_NAME = 'certicredia',
  DB_USER = 'certicredia_user',
  DB_PASSWORD = 'your_secure_password_here'
} = process.env;

// Demo organizations (matching generate_demo_auditing_organizations.js)
const DEMO_ORGS = [
  { id: 'techcorp-global', name: 'TechCorp Global', industry: 'Technology', size: 'enterprise', country: 'US', language: 'en-US' },
  { id: 'financefirst-bank', name: 'FinanceFirst Bank', industry: 'Finance', size: 'enterprise', country: 'US', language: 'en-US' },
  { id: 'healthplus-clinic', name: 'HealthPlus Clinic', industry: 'Healthcare', size: 'medium', country: 'IT', language: 'it-IT' },
  { id: 'retailmax-store', name: 'RetailMax Italia', industry: 'Retail', size: 'small', country: 'IT', language: 'it-IT' },
  { id: 'edulearn-academy', name: 'EduLearn Academy USA', industry: 'Education', size: 'medium', country: 'US', language: 'en-US' }
];

// Colors
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

/**
 * Transform Field Kit generated data to DB format
 * - Convert indicator IDs from "1.1" to "1-1"
 * - Convert bayesian_score (0-1) to value (0-3)
 */
function transformToDBFormat(assessments) {
  const dbData = {};

  for (const [indicatorId, assessment] of Object.entries(assessments)) {
    // Convert "1.1" to "1-1" for DB
    const dbKey = indicatorId.replace('.', '-');

    // Convert bayesian_score (0-1) to value (0-3)
    const bayesianScore = assessment.bayesian_score || 0;
    let value;
    if (bayesianScore === 0) {
      value = 0; // Not applicable
    } else if (bayesianScore < 0.33) {
      value = 1; // Low
    } else if (bayesianScore < 0.66) {
      value = 2; // Medium
    } else {
      value = 3; // High
    }

    dbData[dbKey] = {
      value: value,
      notes: assessment.raw_data?.client_conversation?.notes ||
             `Assessment for ${indicatorId} - Score: ${bayesianScore.toFixed(2)}`,
      last_updated: new Date().toISOString()
    };
  }

  return dbData;
}

/**
 * Transform aggregates to metadata format
 */
function transformToMetadata(aggregates) {
  return {
    completion_percentage: aggregates.completion?.percentage || 0,
    assessed_indicators: aggregates.completion?.assessed_indicators || 0,
    total_indicators: 100,
    overall_risk: aggregates.overall_risk || 0,
    maturity_level: getRiskLabel(aggregates.overall_risk || 0),
    overall_confidence: aggregates.overall_confidence || 0,
    category_stats: aggregates.by_category || {},
    maturity_model: aggregates.maturity_model || {},
    generated_at: new Date().toISOString(),
    generator: 'Field Kit Perfect Generator v1.0'
  };
}

function getRiskLabel(score) {
  if (score < 0.3) return 'low';
  if (score < 0.7) return 'medium';
  return 'high';
}

/**
 * Find organization ID in database by name
 */
async function findOrganizationId(client, orgName) {
  const result = await client.query(
    'SELECT id FROM organizations WHERE name = $1 LIMIT 1',
    [orgName]
  );

  return result.rows.length > 0 ? result.rows[0].id : null;
}

/**
 * Main seeding function
 */
async function seedPerfectCPFData() {
  const config = {
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD
  };

  // Check if DATABASE_URL is set (Render/production)
  const url = new URL(process.env.DATABASE_URL || '');
  if (process.env.DATABASE_URL) {
    config.connectionString = process.env.DATABASE_URL;
    config.ssl = url.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : false;
  }

  const client = new pg.Client(config);

  try {
    await client.connect();
    log('\n🌱 Perfect CPF Data Seeder\n', colors.cyan);
    log('='.repeat(60), colors.cyan);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let notFound = 0;

    for (const orgConfig of DEMO_ORGS) {
      log(`\n📊 Processing: ${orgConfig.name}`, colors.blue);
      log('-'.repeat(60));

      // 1. Find organization in DB
      const orgId = await findOrganizationId(client, orgConfig.name);

      if (!orgId) {
        log(`   ⚠️  Organization not found in DB - skipping`, colors.yellow);
        notFound++;
        continue;
      }

      log(`   ✓ Found in DB (ID: ${orgId})`, colors.green);

      // 2. Generate perfect data using Field Kit
      log(`   🔄 Generating Field Kit data...`);
      const orgData = generateOrganization(orgConfig);

      const assessmentCount = Object.keys(orgData.assessments).length;
      log(`   ✓ Generated ${assessmentCount} assessments`, colors.green);

      // 3. Transform to DB format
      const dbAssessmentData = transformToDBFormat(orgData.assessments);
      const metadata = transformToMetadata(orgData.aggregates);

      // 4. Check if assessment exists
      const existing = await client.query(
        'SELECT id, assessment_data FROM cpf_auditing_assessments WHERE organization_id = $1 AND deleted_at IS NULL',
        [orgId]
      );

      if (existing.rows.length > 0) {
        // Check if it has real data
        const existingData = existing.rows[0].assessment_data;
        const hasData = existingData && Object.keys(existingData).length > 0 &&
                       Object.values(existingData).some(ind => ind.value > 0);

        if (hasData) {
          log(`   ⏭️  SKIP (already has data)`, colors.yellow);
          skipped++;
          continue;
        }

        // Update existing empty record
        await client.query(`
          UPDATE cpf_auditing_assessments
          SET assessment_data = $1, metadata = $2, last_assessment_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [JSON.stringify(dbAssessmentData), JSON.stringify(metadata), existing.rows[0].id]);

        log(`   ✓ UPDATED (${metadata.completion_percentage}% complete, ${metadata.maturity_level} risk)`, colors.green);
        updated++;
      } else {
        // Create new record
        await client.query(`
          INSERT INTO cpf_auditing_assessments
          (organization_id, assessment_data, metadata, last_assessment_date)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        `, [orgId, JSON.stringify(dbAssessmentData), JSON.stringify(metadata)]);

        log(`   ✓ CREATED (${metadata.completion_percentage}% complete, ${metadata.maturity_level} risk)`, colors.green);
        created++;
      }

      // Log stats
      log(`   📊 Stats:`, colors.cyan);
      log(`      - Assessed: ${metadata.assessed_indicators}/100 (${metadata.completion_percentage}%)`, colors.cyan);
      log(`      - Overall Risk: ${(metadata.overall_risk * 100).toFixed(1)}% (${metadata.maturity_level})`, colors.cyan);
      log(`      - Confidence: ${(metadata.overall_confidence * 100).toFixed(1)}%`, colors.cyan);
    }

    // Final summary
    log('\n' + '='.repeat(60), colors.cyan);
    log('\n✅ Seeding Complete!\n', colors.green);
    log(`📊 Summary:`, colors.cyan);
    log(`   - Created: ${created}`, colors.green);
    log(`   - Updated: ${updated}`, colors.yellow);
    log(`   - Skipped (has data): ${skipped}`, colors.yellow);
    log(`   - Not found in DB: ${notFound}`, colors.red);
    log();

    if (notFound > 0) {
      log(`⚠️  ${notFound} organization(s) not found. Run seedEnhancedDemoData.js first!`, colors.yellow);
    }

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run
seedPerfectCPFData()
  .then(() => {
    log('🎉 All done!\n', colors.green);
    process.exit(0);
  })
  .catch((error) => {
    log(`💥 Fatal error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  });
