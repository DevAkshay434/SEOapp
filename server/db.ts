import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

// Dynamic import and access .default.Pool
const pg = await import('pg');
const Pool = pg.default.Pool;

export const pool = new Pool({
  connectionString: 'postgresql://TopshopSEO_owner:npg_13IeQPZvxTnR@ep-solitary-flower-a8ek2vi0-pooler.eastus2.azure.neon.tech/TopshopSEO?sslmode=require',
  ssl: {
    rejectUnauthorized: false, // Important for Neon.tech SSL
  },
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err: any) => {
  console.error('Unexpected error on idle database client', err);
  if (err?.code) console.log(`Database error code: ${err.code}`);
  setTimeout(() => {
    console.log('Attempting to recover database connections...');
  }, 5000);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing database pool');
  pool.end().then(() => {
    console.log('Database pool has ended');
  });
});

export const db = drizzle(pool, { schema });
