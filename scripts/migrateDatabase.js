import { pool } from '../server/config/database.js';

async function migrateDatabase() {
  const client = await pool.connect();

  try {
    console.log('🔧 Running database migrations...\n');

    await client.query('BEGIN');

    // Check and add missing columns in specialist_assignments
    console.log('📊 Checking specialist_assignments table...');

    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'specialist_assignments'
      );
    `);

    if (tableExists.rows[0].exists) {
      // Add token_hash if missing
      await client.query(`
        ALTER TABLE specialist_assignments
        ADD COLUMN IF NOT EXISTS token_hash VARCHAR(255);
      `);

      // Add assigned_by if missing
      await client.query(`
        ALTER TABLE specialist_assignments
        ADD COLUMN IF NOT EXISTS assigned_by INTEGER REFERENCES users(id);
      `);

      // Add revoked_at if missing
      await client.query(`
        ALTER TABLE specialist_assignments
        ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP;
      `);

      console.log('✅ specialist_assignments table updated\n');
    }

    // Fix organizations table structure
    console.log('📊 Checking organizations table...');

    const orgExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'organizations'
      );
    `);

    if (orgExists.rows[0].exists) {
      // Rename columns if needed
      await client.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='organizations' AND column_name='email') THEN
            ALTER TABLE organizations RENAME COLUMN email TO contact_email;
          END IF;
        END $$;
      `).catch(() => {});  // Ignore if already renamed

      await client.query(`
        ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
      `);

      await client.query(`
        ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
      `);

      // Add type column if missing (rename organization_type to type)
      await client.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='organizations' AND column_name='organization_type') THEN
            ALTER TABLE organizations RENAME COLUMN organization_type TO type;
          END IF;
        END $$;
      `).catch(() => {});

      await client.query(`
        ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS type VARCHAR(50);
      `);

      console.log('✅ organizations table updated\n');
    } else {
      console.log('⚠️  organizations table does not exist, will be created by schema\n');
    }

    await client.query('COMMIT');

    console.log('✅ Database migrations completed!\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error running migrations:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
migrateDatabase()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
