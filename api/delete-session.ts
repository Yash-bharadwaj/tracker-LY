import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Ensure tables exist
async function ensureTables() {
  await pool.query(`
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
  `);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  
  try {
    await ensureTables();
  } catch (err: any) {
    console.error('Table initialization error:', err);
  }

  const { id } = req.query;

  try {
    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ error: 'Session ID is required' });
      }
      await pool.query('DELETE FROM sessions WHERE id = $1', [id]);
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
  }
}

