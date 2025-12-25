import { VercelRequest, VercelResponse } from '@vercel/node';
import { dbService } from '../../services/dbService';
import { Session } from '../../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;

  if (req.method === 'GET') {
    try {
      const session = await dbService.getSessionById(id);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.status(200).json({ session });
    } catch (error: any) {
      console.error('Error in GET /api/sessions/[id]:', error);
      res.status(500).json({ error: 'Failed to fetch session', message: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const body = req.body;
      const session: Session = {
        id: id,
        userId: body.userId,
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        task: body.task,
        durationMinutes: body.durationMinutes,
        createdAt: body.createdAt || Date.now()
      };

      const savedSession = await dbService.saveSession(session);
      res.status(200).json({ session: savedSession });
    } catch (error: any) {
      console.error('Error in PUT /api/sessions/[id]:', error);
      res.status(500).json({ error: 'Failed to update session', message: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      await dbService.deleteSession(id);
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error in DELETE /api/sessions/[id]:', error);
      res.status(500).json({ error: 'Failed to delete session', message: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

