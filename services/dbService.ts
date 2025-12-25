import { sql } from '@vercel/postgres';
import { Session } from '../types';

export class DbService {
  async getAllSessions(userId?: string): Promise<Session[]> {
    try {
      let result;
      if (userId) {
        result = await sql`
          SELECT * FROM sessions 
          WHERE "userId" = ${userId}
          ORDER BY date DESC, "startTime" DESC
        `;
      } else {
        result = await sql`
          SELECT * FROM sessions 
          ORDER BY date DESC, "startTime" DESC
        `;
      }
      return result.rows.map(this.mapRowToSession);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  }

  async getSessionsByDate(date: string, userId?: string): Promise<Session[]> {
    try {
      let result;
      if (userId) {
        result = await sql`
          SELECT * FROM sessions 
          WHERE date = ${date} AND "userId" = ${userId}
          ORDER BY "startTime" ASC
        `;
      } else {
        result = await sql`
          SELECT * FROM sessions 
          WHERE date = ${date}
          ORDER BY "startTime" ASC
        `;
      }
      return result.rows.map(this.mapRowToSession);
    } catch (error) {
      console.error('Error fetching sessions by date:', error);
      throw error;
    }
  }

  async getSessionById(id: string): Promise<Session | null> {
    try {
      const result = await sql`
        SELECT * FROM sessions WHERE id = ${id}
      `;
      if (result.rows.length === 0) return null;
      return this.mapRowToSession(result.rows[0]);
    } catch (error) {
      console.error('Error fetching session:', error);
      throw error;
    }
  }

  async saveSession(session: Session): Promise<Session> {
    try {
      await sql`
        INSERT INTO sessions (id, "userId", date, "startTime", "endTime", task, "durationMinutes", "createdAt", "updatedAt")
        VALUES (${session.id}, ${session.userId}, ${session.date}, ${session.startTime}, ${session.endTime}, ${session.task}, ${session.durationMinutes}, ${session.createdAt}, ${Date.now()})
        ON CONFLICT (id) 
        DO UPDATE SET
          "userId" = EXCLUDED."userId",
          date = EXCLUDED.date,
          "startTime" = EXCLUDED."startTime",
          "endTime" = EXCLUDED."endTime",
          task = EXCLUDED.task,
          "durationMinutes" = EXCLUDED."durationMinutes",
          "updatedAt" = EXCLUDED."updatedAt"
      `;
      return session;
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  async deleteSession(id: string): Promise<void> {
    try {
      await sql`
        DELETE FROM sessions WHERE id = ${id}
      `;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  async getSetting<T>(userId: string, key: string): Promise<T | null> {
    try {
      const result = await sql`
        SELECT value FROM settings 
        WHERE "userId" = ${userId} AND key = ${key}
      `;
      if (result.rows.length === 0) return null;
      return JSON.parse(result.rows[0].value || 'null') as T;
    } catch (error) {
      console.error('Error fetching setting:', error);
      return null;
    }
  }

  async setSetting(userId: string, key: string, value: any): Promise<void> {
    try {
      await sql`
        INSERT INTO settings ("userId", key, value, "updatedAt")
        VALUES (${userId}, ${key}, ${JSON.stringify(value)}, ${Date.now()})
        ON CONFLICT ("userId", key)
        DO UPDATE SET
          value = EXCLUDED.value,
          "updatedAt" = EXCLUDED."updatedAt"
      `;
    } catch (error) {
      console.error('Error saving setting:', error);
      throw error;
    }
  }

  async getAllSettings(userId: string): Promise<Record<string, any>> {
    try {
      const result = await sql`
        SELECT key, value FROM settings 
        WHERE "userId" = ${userId}
      `;
      const settings: Record<string, any> = {};
      result.rows.forEach(row => {
        try {
          settings[row.key] = JSON.parse(row.value || 'null');
        } catch {
          settings[row.key] = row.value;
        }
      });
      return settings;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return {};
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await sql`DELETE FROM sessions`;
      await sql`DELETE FROM settings`;
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  private mapRowToSession(row: any): Session {
    return {
      id: row.id,
      userId: row.userId as 'Yashwanth' | 'Lahari',
      date: row.date,
      startTime: row.startTime,
      endTime: row.endTime,
      task: row.task,
      durationMinutes: row.durationMinutes,
      createdAt: row.createdAt
    };
  }
}

export const dbService = new DbService();

