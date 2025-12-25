import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
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
      res.status(200).json({ success: true, message: 'Database initialized successfully' });
    } finally {
      client.release();
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
}

