import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });
import pg from 'pg';

async function check() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log('Checking roles table...');
  const roles = await pool.query('SELECT * FROM roles');
  console.log('Roles:', roles.rows);

  console.log('\nChecking users table columns...');
  const cols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users'
  `);
  console.log('Users columns:', cols.rows);

  await pool.end();
}

check().catch(console.error);
