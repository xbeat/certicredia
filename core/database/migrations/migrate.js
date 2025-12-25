import { pool } from '../connection.js';
import logger from '../../utils/logger.js';

/**
 * Simple Migration Runner
 * Tracks and executes database migrations
 */

// Create migrations tracking table
const createMigrationsTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

// Check if migration was executed
const wasExecuted = async (client, name) => {
  const result = await client.query(
    'SELECT id FROM migrations WHERE name = $1',
    [name]
  );
  return result.rows.length > 0;
};

// Record migration execution
const recordMigration = async (client, name) => {
  await client.query(
    'INSERT INTO migrations (name) VALUES ($1)',
    [name]
  );
};

// Remove migration record
const removeMigration = async (client, name) => {
  await client.query(
    'DELETE FROM migrations WHERE name = $1',
    [name]
  );
};

// List of migrations in order
const migrations = [
  {
    name: '001_accreditation_system',
    module: () => import('./001_accreditation_system.js')
  }
];

/**
 * Run all pending migrations
 */
export const migrateUp = async () => {
  const client = await pool.connect();

  try {
    logger.info('🔄 Starting database migrations...');

    await createMigrationsTable(client);

    let executedCount = 0;

    for (const migration of migrations) {
      const alreadyExecuted = await wasExecuted(client, migration.name);

      if (alreadyExecuted) {
        logger.info(`⏭️  Skipping ${migration.name} (already executed)`);
        continue;
      }

      logger.info(`▶️  Executing migration: ${migration.name}`);

      const migrationModule = await migration.module();
      await migrationModule.up();

      await recordMigration(client, migration.name);

      executedCount++;
    }

    if (executedCount === 0) {
      logger.info('✅ Database is up to date (no migrations to run)');
    } else {
      logger.success(`✅ Executed ${executedCount} migration(s) successfully`);
    }

  } catch (error) {
    logger.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Rollback last migration
 */
export const migrateDown = async () => {
  const client = await pool.connect();

  try {
    logger.warn('⚠️  Starting migration rollback...');

    await createMigrationsTable(client);

    // Get last executed migration
    const result = await client.query(
      'SELECT name FROM migrations ORDER BY executed_at DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      logger.info('ℹ️  No migrations to rollback');
      return;
    }

    const lastMigration = result.rows[0].name;
    logger.warn(`⏪ Rolling back migration: ${lastMigration}`);

    // Find and execute rollback
    const migration = migrations.find(m => m.name === lastMigration);

    if (!migration) {
      throw new Error(`Migration ${lastMigration} not found in migration list`);
    }

    const migrationModule = await migration.module();
    await migrationModule.down();

    await removeMigration(client, lastMigration);

    logger.success(`✅ Rolled back migration: ${lastMigration}`);

  } catch (error) {
    logger.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Show migration status
 */
export const migrateStatus = async () => {
  const client = await pool.connect();

  try {
    await createMigrationsTable(client);

    const result = await client.query(
      'SELECT name, executed_at FROM migrations ORDER BY executed_at ASC'
    );

    logger.info('\n📊 Migration Status:\n');

    if (result.rows.length === 0) {
      logger.info('No migrations executed yet\n');
    } else {
      logger.info('Executed migrations:');
      result.rows.forEach(row => {
        const date = new Date(row.executed_at).toLocaleString('it-IT');
        logger.info(`  ✅ ${row.name} (${date})`);
      });
      logger.info('');
    }

    const executedNames = result.rows.map(r => r.name);
    const pending = migrations.filter(m => !executedNames.includes(m.name));

    if (pending.length > 0) {
      logger.info('Pending migrations:');
      pending.forEach(m => {
        logger.info(`  ⏳ ${m.name}`);
      });
      logger.info('');
    } else {
      logger.info('No pending migrations\n');
    }

  } catch (error) {
    logger.error('❌ Failed to get migration status:', error);
    throw error;
  } finally {
    client.release();
  }
};

// CLI interface
if (process.argv[1].endsWith('migrate.js')) {
  const command = process.argv[2];

  (async () => {
    try {
      switch (command) {
        case 'up':
          await migrateUp();
          break;
        case 'down':
          await migrateDown();
          break;
        case 'status':
          await migrateStatus();
          break;
        default:
          console.log(`
Usage:
  node migrate.js up      - Run all pending migrations
  node migrate.js down    - Rollback last migration
  node migrate.js status  - Show migration status
          `);
          process.exit(1);
      }
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  })();
}
