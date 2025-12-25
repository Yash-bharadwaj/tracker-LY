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
    CREATE INDEX IF NOT EXISTS idx_sessions_userid ON sessions("userId");
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
    CREATE INDEX IF NOT EXISTS idx_sessions_userid_date ON sessions("userId", date);
  `);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  
  try {
    await ensureTables();
  } catch (err: any) {
    console.error('Table initialization error:', err);
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
    console.error('API Error:', error);
    res.status(500).json({ error: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
  }
}
