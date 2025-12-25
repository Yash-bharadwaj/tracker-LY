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

  const { id } = req.query;

  try {
    if (req.method === 'DELETE') {
      await pool.query('DELETE FROM sessions WHERE id = $1', [id]);
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Delete session API error:', error);
    const errorMessage = error.message || 'Internal server error';
    const errorResponse: any = { error: errorMessage };
    
    if (process.env.NODE_ENV === 'development' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorResponse.stack = error.stack;
      errorResponse.code = error.code;
    }
    
    res.status(500).json(errorResponse);
  }
}

