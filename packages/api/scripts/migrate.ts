import 'dotenv/config';
import { config } from 'dotenv';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { FileMigrationProvider, Kysely, Migrator, PostgresDialect } from 'kysely';

// Load .env.local first, then .env
config({ path: '.env.local' });
config({ path: '.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// biome-ignore lint/suspicious/noExplicitAny: migration script operates without typed schema
function createDb(): Kysely<any> {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error('DATABASE_URL is required');
  }

  const parsed = new URL(url);
  const ssl = parsed.searchParams.get('sslmode') === 'require';

  console.log(`Connecting to database: ${parsed.hostname}:${parsed.port}${parsed.pathname}`);

  return new Kysely({
    dialect: new PostgresDialect({
      pool: new pg.Pool({
        connectionString: url,
        ssl: ssl ? { rejectUnauthorized: false } : undefined,
      }),
    }),
  });
}

const command = process.argv[2] ?? 'latest';

async function runMigrator() {
  const db = createDb();

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, '..', 'migrations'),
    }),
  });

  let results: Awaited<ReturnType<typeof migrator.migrateToLatest>>['results'];
  let error: unknown;

  switch (command) {
    case 'latest': {
      const r = await migrator.migrateToLatest();
      results = r.results;
      error = r.error;
      break;
    }
    case 'down': {
      const r = await migrator.migrateDown();
      results = r.results;
      error = r.error;
      break;
    }
    case 'up': {
      const r = await migrator.migrateUp();
      results = r.results;
      error = r.error;
      break;
    }
    case 'status': {
      const migrations = await migrator.getMigrations();
      console.log('\nMigration status:');
      for (const m of migrations) {
        const status = m.executedAt ? `✅ ${m.executedAt.toISOString()}` : '⏳ pending';
        console.log(`  ${m.name}: ${status}`);
      }
      await db.destroy();
      return;
    }
    default: {
      console.error(`Unknown command: ${command}`);
      console.log('Usage: tsx scripts/migrate.ts [latest|up|down|status]');
      await db.destroy();
      process.exit(1);
    }
  }

  for (const r of results ?? []) {
    if (r.status === 'Success') {
      console.log(`✅ ${r.migrationName} (${r.direction})`);
    } else if (r.status === 'Error') {
      console.error(`❌ ${r.migrationName} (${r.direction})`);
    } else {
      console.log(`⏭️  ${r.migrationName} (not executed)`);
    }
  }

  if (error) {
    console.error('Migration failed:', error);
    await db.destroy();
    process.exit(1);
  }

  if (!results?.length) {
    console.log('No migrations to run — already up to date.');
  }

  console.log('All migrations completed!');
  await db.destroy();
}

runMigrator().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
