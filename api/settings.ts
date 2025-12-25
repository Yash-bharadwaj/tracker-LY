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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
    console.error('Settings API error:', error);
    const errorMessage = error.message || 'Internal server error';
    const errorResponse: any = { error: errorMessage };
    
    if (process.env.NODE_ENV === 'development' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorResponse.stack = error.stack;
      errorResponse.code = error.code;
    }
    
    res.status(500).json(errorResponse);
  }
}
