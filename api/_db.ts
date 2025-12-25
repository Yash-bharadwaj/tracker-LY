import { Pool } from 'pg';

// Fallback static link from your vercel-env-variables.txt
const STATIC_URL = "postgres://postgres.pehoocfabafnvrbdkpba:sOgckRGYXm80BGIx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

const cleanConnectionString = (url?: string) => {
  if (!url) return undefined;
  return url.replace(/^"|"$/g, '').trim();
};

const connectionString = cleanConnectionString(process.env.POSTGRES_URL) || STATIC_URL;

let pool: Pool | null = null;

export const getPool = () => {
  if (pool) return pool;

  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  return pool;
};

// Helper to map Postgres rows to Session objects correctly
export const mapSession = (row: any) => ({
  ...row,
  createdAt: Number(row.createdAt),
  durationMinutes: Number(row.durationMinutes)
});
