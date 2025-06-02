import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

// Dynamic import and access .default.Pool
const pg = await import('pg');
const Pool = pg.default.Pool;

export const pool = new Pool({
  connectionString: 'postgresql://topshopseo_user:Eu49yj9WlHD5nGzOTwQsq7PDfyz7otF4@dpg-d0dfunqdbo4c738gmsrg-a.oregon-postgres.render.com/topshopseo',
  ssl: {
    rejectUnauthorized: false, // Required for Render's external DB
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
