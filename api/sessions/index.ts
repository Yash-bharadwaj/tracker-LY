import { VercelRequest, VercelResponse } from '@vercel/node';
import { dbService } from '../services/dbService';
import { Session } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const userId = req.query.userId as string | undefined;
      const date = req.query.date as string | undefined;

      let sessions: Session[];

      if (date) {
        sessions = await dbService.getSessionsByDate(date, userId);
      } else {
        sessions = await dbService.getAllSessions(userId);
      }

      res.status(200).json({ sessions });
    } catch (error: any) {
      console.error('Error in GET /api/sessions:', error);
      res.status(500).json({ error: 'Failed to fetch sessions', message: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const body = req.body;
      const session: Session = {
        id: body.id,
        userId: body.userId,
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        task: body.task,
        durationMinutes: body.durationMinutes,
        createdAt: body.createdAt || Date.now()
      };

      const savedSession = await dbService.saveSession(session);
      res.status(201).json({ session: savedSession });
    } catch (error: any) {
      console.error('Error in POST /api/sessions:', error);
      res.status(500).json({ error: 'Failed to create session', message: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

