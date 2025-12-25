import { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      // Execute queries one by one for maximum compatibility
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
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS settings (
          "userId" VARCHAR(50) NOT NULL,
          key VARCHAR(255) NOT NULL,
          value TEXT,
          "updatedAt" BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
          PRIMARY KEY ("userId", key)
        )
      `);
      
      res.status(200).json({ success: true, message: 'Database initialized successfully' });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('API Init Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      hint: 'Ensure POSTGRES_URL is correct and not wrapped in extra quotes.'
    });
  }
}

