import { VercelRequest, VercelResponse } from '@vercel/node';
import { dbService } from '../services/dbService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'GET') {
    try {
      const userId = req.query.userId as string;
      const key = req.query.key as string | undefined;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      if (key) {
        const value = await dbService.getSetting(userId, key);
        return res.status(200).json({ key, value });
      } else {
        const settings = await dbService.getAllSettings(userId);
        return res.status(200).json({ settings });
      }
    } catch (error: any) {
      console.error('Error in GET /api/settings:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch settings', 
        message: error.message,
        details: error.stack
      });
    }
  } else if (req.method === 'POST') {
    try {
      const { userId, key, value } = req.body;

      if (!userId || !key) {
        return res.status(400).json({ error: 'userId and key are required' });
      }

      await dbService.setSetting(userId, key, value);
      return res.status(200).json({ success: true, key, value });
    } catch (error: any) {
      console.error('Error in POST /api/settings:', error);
      return res.status(500).json({ 
        error: 'Failed to save setting', 
        message: error.message,
        details: error.stack
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
