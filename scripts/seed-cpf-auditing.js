/**
 * CPF Auditing Seed Script
 *
 * This script creates sample CPF auditing assessments for existing organizations
 * in the database. It generates realistic assessment data with random values.
 *
 * Usage: node scripts/seed-cpf-auditing.js
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = 5432,
  DB_NAME = 'certicredia',
  DB_USER = 'certicredia_user',
  DB_PASSWORD = 'your_secure_password_here'
} = process.env;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Generate random assessment data for 100 CPF indicators
 */
function generateAssessmentData() {
  const data = {};

  // Generate 100 indicators (10 categories x 10 indicators)
  for (let cat = 1; cat <= 10; cat++) {
    for (let ind = 1; ind <= 10; ind++) {
      const indicatorId = `${cat}-${ind}`;

      // Random value: 0 (not applicable), 1 (low), 2 (medium), 3 (high)
      // Most indicators will have values, few will be 0
      const value = Math.random() < 0.1 ? 0 : Math.floor(Math.random() * 3) + 1;

      data[indicatorId] = {
        value,
        notes: value > 0 ? `Assessment note for indicator ${indicatorId}` : '',
        last_updated: new Date().toISOString()
      };
    }
  }

  return data;
}

/**
 * Calculate metadata from assessment data
 */
function calculateMetadata(assessmentData) {
  let totalIndicators = 0;
  let answeredIndicators = 0;
  let totalScore = 0;
  let maxScore = 0;

  Object.values(assessmentData).forEach(indicator => {
    totalIndicators++;
    if (indicator.value > 0) {
      answeredIndicators++;
      totalScore += indicator.value;
      maxScore += 3; // Max value is 3
    }
  });

  const completionPercentage = totalIndicators > 0
    ? Math.round((answeredIndicators / totalIndicators) * 100)
    : 0;

  const maturityScore = maxScore > 0
    ? Math.round((totalScore / maxScore) * 100)
    : 0;

  // Determine maturity level
  let maturityLevel = 'Initial';
  if (maturityScore >= 80) maturityLevel = 'Optimized';
  else if (maturityScore >= 60) maturityLevel = 'Managed';
  else if (maturityScore >= 40) maturityLevel = 'Defined';
  else if (maturityScore >= 20) maturityLevel = 'Repeatable';

  // Calculate risk score (inverse of maturity)
  const riskScore = 100 - maturityScore;

  return {
    completion_percentage: completionPercentage,
    maturity_score: maturityScore,
    maturity_level: maturityLevel,
    risk_score: riskScore,
    total_indicators: totalIndicators,
    answered_indicators: answeredIndicators,
    last_calculated: new Date().toISOString()
  };
}

/**
 * Seed CPF auditing assessments
 */
async function seedAssessments() {
  log('\n🌱 CPF Auditing Seed Script', colors.blue);
  log('=' .repeat(50), colors.blue);

  const client = new pg.Client({
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD
  });

  try {
    await client.connect();
    log('\n✓ Connected to database', colors.green);

    // Get all organizations
    const orgsResult = await client.query(`
      SELECT id, name, organization_type, status
      FROM organizations
      WHERE status = 'active'
      ORDER BY id
    `);

    if (orgsResult.rows.length === 0) {
      log('\n⚠️  No active organizations found in database', colors.yellow);
      log('Please create organizations first using the admin panel or registration', colors.yellow);
      await client.end();
      return;
    }

    log(`\n📊 Found ${orgsResult.rows.length} active organization(s)`, colors.blue);

    let created = 0;
    let skipped = 0;

    for (const org of orgsResult.rows) {
      log(`\n📝 Processing: ${org.name} (ID: ${org.id})`, colors.yellow);

      // Check if assessment already exists
      const existing = await client.query(
        'SELECT id FROM cpf_auditing_assessments WHERE organization_id = $1 AND deleted_at IS NULL',
        [org.id]
      );

      if (existing.rows.length > 0) {
        log(`  ⏭️  Assessment already exists, skipping`, colors.yellow);
        skipped++;
        continue;
      }

      // Generate assessment data
      const assessmentData = generateAssessmentData();
      const metadata = calculateMetadata(assessmentData);

      // Insert assessment
      await client.query(`
        INSERT INTO cpf_auditing_assessments
        (organization_id, assessment_data, metadata, last_assessment_date)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      `, [org.id, JSON.stringify(assessmentData), JSON.stringify(metadata)]);

      log(`  ✓ Created assessment (${metadata.completion_percentage}% complete, ${metadata.maturity_level})`, colors.green);
      created++;
    }

    log('\n' + '='.repeat(50), colors.green);
    log(`✅ Seed Complete!`, colors.green);
    log(`   Created: ${created}`, colors.green);
    log(`   Skipped: ${skipped}`, colors.yellow);
    log('='.repeat(50), colors.green);

    // Show statistics
    const stats = await client.query(`
      SELECT
        COUNT(*) as total,
        AVG((metadata->>'completion_percentage')::numeric) as avg_completion,
        AVG((metadata->>'maturity_score')::numeric) as avg_maturity
      FROM cpf_auditing_assessments
      WHERE deleted_at IS NULL
    `);

    const { total, avg_completion, avg_maturity } = stats.rows[0];

    log('\n📊 Current Statistics:', colors.blue);
    log(`   Total Assessments: ${total}`, colors.reset);
    log(`   Avg Completion: ${Math.round(avg_completion || 0)}%`, colors.reset);
    log(`   Avg Maturity Score: ${Math.round(avg_maturity || 0)}%`, colors.reset);

    log('\n📝 Next steps:', colors.blue);
    log('  1. Start the server: npm start', colors.reset);
    log('  2. Login to admin panel', colors.reset);
    log('  3. Go to Organizations section', colors.reset);
    log('  4. Click on an organization to open its auditing dashboard\n', colors.reset);

    await client.end();
  } catch (error) {
    log(`\n✗ Error: ${error.message}`, colors.red);
    console.error(error);
    await client.end();
    process.exit(1);
  }
}

// Run the seed
seedAssessments();
