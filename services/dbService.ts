import { sql, createPool } from '@vercel/postgres';
import { Session } from '../types';

export class DbService {
  private initialized = false;

  private async getPool() {
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }
    return sql;
  }

  async ensureTables() {
    if (this.initialized) return;
    
    try {
      const db = await this.getPool();
      
      // Create sessions table
      await db`
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
      `;

      // Create settings table
      await db`
        CREATE TABLE IF NOT EXISTS settings (
          "userId" VARCHAR(50) NOT NULL,
          key VARCHAR(255) NOT NULL,
          value TEXT,
          "updatedAt" BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
          PRIMARY KEY ("userId", key)
        )
      `;

      this.initialized = true;
      console.log('Database tables initialized');
    } catch (error) {
      console.error('Failed to initialize database tables:', error);
      throw error;
    }
  }

  async getAllSessions(userId?: string): Promise<Session[]> {
    await this.ensureTables();
    try {
      const db = await this.getPool();
      let result;
      if (userId) {
        result = await db`
          SELECT * FROM sessions 
          WHERE "userId" = ${userId}
          ORDER BY date DESC, "startTime" DESC
        `;
      } else {
        result = await db`
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
    await this.ensureTables();
    try {
      const db = await this.getPool();
      let result;
      if (userId) {
        result = await db`
          SELECT * FROM sessions 
          WHERE date = ${date} AND "userId" = ${userId}
          ORDER BY "startTime" ASC
        `;
      } else {
        result = await db`
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
    await this.ensureTables();
    try {
      const db = await this.getPool();
      const result = await db`
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
    await this.ensureTables();
    try {
      const db = await this.getPool();
      const now = Date.now();
      await db`
        INSERT INTO sessions (id, "userId", date, "startTime", "endTime", task, "durationMinutes", "createdAt", "updatedAt")
        VALUES (${session.id}, ${session.userId}, ${session.date}, ${session.startTime}, ${session.endTime}, ${session.task}, ${session.durationMinutes}, ${session.createdAt}, ${now})
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
    await this.ensureTables();
    try {
      const db = await this.getPool();
      await db`
        DELETE FROM sessions WHERE id = ${id}
      `;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  async getSetting<T>(userId: string, key: string): Promise<T | null> {
    await this.ensureTables();
    try {
      const db = await this.getPool();
      const result = await db`
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
    await this.ensureTables();
    try {
      const db = await this.getPool();
      const now = Date.now();
      await db`
        INSERT INTO settings ("userId", key, value, "updatedAt")
        VALUES (${userId}, ${key}, ${JSON.stringify(value)}, ${now})
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
    await this.ensureTables();
    try {
      const db = await this.getPool();
      const result = await db`
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
    await this.ensureTables();
    try {
      const db = await this.getPool();
      await db`DELETE FROM sessions`;
      await db`DELETE FROM settings`;
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
      createdAt: Number(row.createdAt)
    };
  }
}

export const dbService = new DbService();

