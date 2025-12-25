import { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool, mapSession } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const { userId, date } = req.query;

  try {
    const pool = getPool();
    if (req.method === 'GET') {
      let result;
      if (userId && date) {
        result = await pool.query('SELECT * FROM sessions WHERE "userId" = $1 AND date = $2 ORDER BY "startTime" ASC', [userId, date]);
      } else if (userId) {
        result = await pool.query('SELECT * FROM sessions WHERE "userId" = $1 ORDER BY date DESC, "startTime" DESC', [userId]);
      } else {
        result = await pool.query('SELECT * FROM sessions ORDER BY date DESC, "startTime" DESC');
      }
      // Properly map Postgres BIGINT to JS numbers
      const sessions = result.rows.map(mapSession);
      res.status(200).json({ sessions });
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
    console.error('API Sessions Error:', error);
    res.status(500).json({ error: error.message });
  }
}

