import { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const { id } = req.query;

  try {
    const pool = getPool();
    if (req.method === 'DELETE') {
      await pool.query('DELETE FROM sessions WHERE id = $1', [id]);
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API Delete Error:', error);
    res.status(500).json({ error: error.message });
  }
}

