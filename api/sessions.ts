import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

if (!process.env.POSTGRES_URL) {
  console.error('POSTGRES_URL environment variable is not set');
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function ensureTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        "userId" VARCHAR(50) NOT NULL,
        date VARCHAR(10) NOT NULL,
        "startTime" VARCHAR(5) NOT NULL,
        "endTime" VARCHAR(5) NOT NULL,
        task TEXT NOT NULL,
        "durationMinutes" INTEGER NOT NULL,
        "createdAt" BIGINT NOT NULL,
        "updatedAt" BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
      );
      CREATE TABLE IF NOT EXISTS settings (
        "userId" VARCHAR(50) NOT NULL,
        key VARCHAR(255) NOT NULL,
        value TEXT,
        "updatedAt" BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
        PRIMARY KEY ("userId", key)
      );
    `);
  } finally {
    client.release();
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ensure tables exist
  try {
    await ensureTables();
  } catch (initError: any) {
    console.error('Table initialization error:', initError);
    // Continue anyway - tables might already exist
  }

  const { userId, date } = req.query;

  try {
    if (req.method === 'GET') {
      let result;
      if (userId && date) {
        result = await pool.query('SELECT * FROM sessions WHERE "userId" = $1 AND date = $2 ORDER BY "startTime" ASC', [userId, date]);
      } else if (userId) {
        result = await pool.query('SELECT * FROM sessions WHERE "userId" = $1 ORDER BY date DESC, "startTime" DESC', [userId]);
      } else {
        result = await pool.query('SELECT * FROM sessions ORDER BY date DESC, "startTime" DESC');
      }
      res.status(200).json({ sessions: result.rows });
    } else if (req.method === 'POST') {
      const { id, userId, date, startTime, endTime, task, durationMinutes, createdAt } = req.body;
      await pool.query(`
        INSERT INTO sessions (id, "userId", date, "startTime", "endTime", task, "durationMinutes", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          "userId" = EXCLUDED."userId", date = EXCLUDED.date, "startTime" = EXCLUDED."startTime",
          "endTime" = EXCLUDED."endTime", task = EXCLUDED.task, "durationMinutes" = EXCLUDED."durationMinutes",
          "updatedAt" = EXCLUDED."updatedAt"
      `, [id, userId, date, startTime, endTime, task, durationMinutes, createdAt || Date.now(), Date.now()]);
      res.status(201).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Sessions API error:', error);
    const errorMessage = error.message || 'Internal server error';
    const errorResponse: any = { error: errorMessage };
    
    // Include stack trace in development or if it's a connection error
    if (process.env.NODE_ENV === 'development' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorResponse.stack = error.stack;
      errorResponse.code = error.code;
    }
    
    res.status(500).json(errorResponse);
  }
}
