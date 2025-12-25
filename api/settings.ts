import { VercelRequest, VercelResponse } from '@vercel/node';
import { dbService } from '../services/dbService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const userId = req.query.userId as string;
      const key = req.query.key as string | undefined;

      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }

      if (key) {
        const value = await dbService.getSetting(userId, key);
        res.setHeader('Cache-Control', 'no-store, max-age=0');
        res.status(200).json({ key, value });
      } else {
        const settings = await dbService.getAllSettings(userId);
        res.setHeader('Cache-Control', 'no-store, max-age=0');
        res.status(200).json({ settings });
      }
    } catch (error: any) {
      console.error('Error in GET /api/settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings', message: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { userId, key, value } = req.body;

      if (!userId || !key) {
        res.status(400).json({ error: 'userId and key are required' });
        return;
      }

      await dbService.setSetting(userId, key, value);
      res.status(200).json({ success: true, key, value });
    } catch (error: any) {
      console.error('Error in POST /api/settings:', error);
      res.status(500).json({ error: 'Failed to save setting', message: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

