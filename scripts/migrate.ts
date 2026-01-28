import 'dotenv/config';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

// Load .env.local first, then .env
config({ path: '.env.local' });
config({ path: '.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const host = process.env.DATABASE_HOST;
  const isNeonHost = host?.includes('neon.tech') || false;

  console.log(`Connecting to database: ${host}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`);

  const pool = new pg.Pool({
    host,
    port: Number(process.env.DATABASE_PORT) || 5432,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: isNeonHost ? { rejectUnauthorized: false } : undefined,
  });

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    console.log(`Running migration: ${file}`);
    await pool.query(sql);
    console.log(`✅ ${file} completed`);
  }

  await pool.end();
  console.log('All migrations completed!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
