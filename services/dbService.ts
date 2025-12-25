import { Pool } from 'pg';
import { Session } from '../types';

export class DbService {
  private initialized = false;
  private pool: Pool | null = null;

  private async getPool() {
    if (this.pool) return this.pool;

    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }

    this.pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false // Required for Supabase/AWS
      }
    });

    return this.pool;
  }

  async ensureTables() {
    if (this.initialized) return;
    
    try {
      const pool = await this.getPool();
      
      // Create sessions table
      await pool.query(`
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

      // Create settings table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS settings (
          "userId" VARCHAR(50) NOT NULL,
          key VARCHAR(255) NOT NULL,
          value TEXT,
          "updatedAt" BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
          PRIMARY KEY ("userId", key)
        )
      `);

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
      const pool = await this.getPool();
      let result;
      if (userId) {
        result = await pool.query(
          'SELECT * FROM sessions WHERE "userId" = $1 ORDER BY date DESC, "startTime" DESC',
          [userId]
        );
      } else {
        result = await pool.query('SELECT * FROM sessions ORDER BY date DESC, "startTime" DESC');
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
      const pool = await this.getPool();
      let result;
      if (userId) {
        result = await pool.query(
          'SELECT * FROM sessions WHERE date = $1 AND "userId" = $2 ORDER BY "startTime" ASC',
          [date, userId]
        );
      } else {
        result = await pool.query(
          'SELECT * FROM sessions WHERE date = $1 ORDER BY "startTime" ASC',
          [date]
        );
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
      const pool = await this.getPool();
      const result = await pool.query('SELECT * FROM sessions WHERE id = $1', [id]);
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
      const pool = await this.getPool();
      const now = Date.now();
      await pool.query(`
        INSERT INTO sessions (id, "userId", date, "startTime", "endTime", task, "durationMinutes", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) 
        DO UPDATE SET
          "userId" = EXCLUDED."userId",
          date = EXCLUDED.date,
          "startTime" = EXCLUDED."startTime",
          "endTime" = EXCLUDED."endTime",
          task = EXCLUDED.task,
          "durationMinutes" = EXCLUDED."durationMinutes",
          "updatedAt" = EXCLUDED."updatedAt"
      `, [
        session.id, session.userId, session.date, session.startTime, 
        session.endTime, session.task, session.durationMinutes, 
        session.createdAt, now
      ]);
      return session;
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  async deleteSession(id: string): Promise<void> {
    await this.ensureTables();
    try {
      const pool = await this.getPool();
      await pool.query('DELETE FROM sessions WHERE id = $1', [id]);
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  async getSetting<T>(userId: string, key: string): Promise<T | null> {
    await this.ensureTables();
    try {
      const pool = await this.getPool();
      const result = await pool.query(
        'SELECT value FROM settings WHERE "userId" = $1 AND key = $2',
        [userId, key]
      );
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
      const pool = await this.getPool();
      const now = Date.now();
      await pool.query(`
        INSERT INTO settings ("userId", key, value, "updatedAt")
        VALUES ($1, $2, $3, $4)
        ON CONFLICT ("userId", key)
        DO UPDATE SET
          value = EXCLUDED.value,
          "updatedAt" = EXCLUDED."updatedAt"
      `, [userId, key, JSON.stringify(value), now]);
    } catch (error) {
      console.error('Error saving setting:', error);
      throw error;
    }
  }

  async getAllSettings(userId: string): Promise<Record<string, any>> {
    await this.ensureTables();
    try {
      const pool = await this.getPool();
      const result = await pool.query(
        'SELECT key, value FROM settings WHERE "userId" = $1',
        [userId]
      );
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
      const pool = await this.getPool();
      await pool.query('DELETE FROM sessions');
      await pool.query('DELETE FROM settings');
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

