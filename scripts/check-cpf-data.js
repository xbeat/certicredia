import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL
});

async function checkData() {
  try {
    await client.connect();

    console.log('📊 Checking CPF Auditing Data...\n');

    // Check organizations
    const orgs = await client.query('SELECT COUNT(*) FROM organizations');
    console.log(`✅ Organizations: ${orgs.rows[0].count}`);

    // Check cpf_auditing_assessments
    const assessments = await client.query('SELECT COUNT(*) FROM cpf_auditing_assessments WHERE deleted_at IS NULL');
    console.log(`✅ CPF Assessments: ${assessments.rows[0].count}`);

    // Check details
    const details = await client.query(`
      SELECT
        o.name,
        c.metadata->>'completion_percentage' as completion,
        c.metadata->>'maturity_level' as maturity
      FROM organizations o
      LEFT JOIN cpf_auditing_assessments c ON o.id = c.organization_id AND c.deleted_at IS NULL
      ORDER BY o.id
      LIMIT 10
    `);

    console.log('\n📋 First 10 Organizations:');
    details.rows.forEach(row => {
      console.log(`   ${row.name}: ${row.completion || 'NO DATA'}% - ${row.maturity || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkData();
