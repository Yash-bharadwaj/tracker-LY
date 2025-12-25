import { Pool } from 'pg';

// Securely clean environment variable (remove extra quotes if they exist)
const cleanConnectionString = (url?: string) => {
  if (!url) return undefined;
  return url.replace(/^"|"$/g, '').trim();
};

const connectionString = cleanConnectionString(process.env.POSTGRES_URL);

// Global pool instance for reuse across serverless function invocations
let pool: Pool | null = null;

export const getPool = () => {
  if (pool) return pool;

  if (!connectionString) {
    throw new Error('POSTGRES_URL is missing in environment variables. Please check your .env.local or Vercel settings.');
  }

  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    // Serverless optimization: don't keep idle connections forever
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });

  return pool;
};

