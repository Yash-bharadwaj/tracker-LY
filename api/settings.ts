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
    CREATE TABLE IF NOT EXISTS settings (
      "userId" VARCHAR(50) NOT NULL,
      key VARCHAR(255) NOT NULL,
      value TEXT,
      "updatedAt" BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
      PRIMARY KEY ("userId", key)
    );
    CREATE INDEX IF NOT EXISTS idx_settings_userid ON settings("userId");
  `);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  
  try {
    await ensureTables();
  } catch (err: any) {
    console.error('Table initialization error:', err);
  }

  const { userId, key } = req.query;

  try {
    if (req.method === 'GET') {
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      const result = await pool.query('SELECT key, value FROM settings WHERE "userId" = $1', [userId]);
      const settings: any = {};
      result.rows.forEach(r => { 
        try {
          settings[r.key] = JSON.parse(r.value || 'null');
        } catch {
          settings[r.key] = r.value;
        }
      });
      res.status(200).json({ settings });
    } else if (req.method === 'POST') {
      const { userId, key, value } = req.body;
      if (!userId || !key) {
        return res.status(400).json({ error: 'userId and key are required' });
      }
      await pool.query(`
        INSERT INTO settings ("userId", key, value, "updatedAt")
        VALUES ($1, $2, $3, $4)
        ON CONFLICT ("userId", key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = EXCLUDED."updatedAt"
      `, [userId, key, JSON.stringify(value), Date.now()]);
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
  }
}
