import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const { userId, key } = req.query;

  try {
    if (req.method === 'GET') {
      if (!userId) return res.status(400).json({ error: 'userId required' });
      const result = await pool.query('SELECT key, value FROM settings WHERE "userId" = $1', [userId]);
      const settings: any = {};
      result.rows.forEach(r => { settings[r.key] = JSON.parse(r.value || 'null'); });
      res.status(200).json({ settings });
    } else if (req.method === 'POST') {
      const { userId, key, value } = req.body;
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
    res.status(500).json({ error: error.message });
  }
}
