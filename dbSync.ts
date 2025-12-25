import { Session } from './types';
import { db } from './db';

// Use environment variable for API base URL, fallback to relative path for production
// For local dev, use VITE_API_BASE_URL from .env.local (e.g., https://tracker-ly.vercel.app)
// For production, use relative path /api
const getApiBase = () => {
  // Check if we're in development and have a custom API URL
  if (import.meta.env.DEV && import.meta.env.VITE_API_BASE_URL) {
    return `${import.meta.env.VITE_API_BASE_URL}/api`;
  }
  // Production or no custom URL - use relative path
  return '/api';
};

const API_BASE = getApiBase();
const SYNC_INTERVAL = 60000; // 60 seconds - only for fetching other user's updates

export class SyncDatabase {
  private syncInterval: number | null = null;
  private isOnline: boolean = navigator.onLine;
  private lastSyncTime: number = 0;
  private syncInProgress: boolean = false;

  constructor() {
    // Listen to online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncFromServer();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async init(): Promise<void> {
    await db.init();
    // Initial sync from server
    if (this.isOnline) {
      await this.syncFromServer();
    }
  }

  async getAllSessions(): Promise<Session[]> {
    // Always return from local cache first (fast)
    return await db.getAllSessions();
  }

  async saveSession(session: Session): Promise<void> {
    // Save to local cache immediately
    await db.saveSession(session);
    
    // Immediately sync this specific session to server
    if (this.isOnline) {
      try {
        this.syncInProgress = true;
        const response = await fetch(`${API_BASE}/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(session)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to save session: ${response.statusText}`);
        }
        
        this.lastSyncTime = Date.now();
      } catch (err) {
        console.error('Failed to sync session to server:', err);
        // Session is still saved locally, will retry on next sync
      } finally {
        this.syncInProgress = false;
      }
    }
  }

  async deleteSession(id: string): Promise<void> {
    // Delete from local cache immediately
    await db.deleteSession(id);
    
    // Immediately delete from server
    if (this.isOnline) {
      try {
        this.syncInProgress = true;
        const response = await fetch(`${API_BASE}/delete-session?id=${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete session: ${response.statusText}`);
        }
        
        this.lastSyncTime = Date.now();
      } catch (err) {
        console.error('Failed to delete session from server:', err);
      } finally {
        this.syncInProgress = false;
      }
    }
  }

  async getSetting<T>(key: string): Promise<T | null> {
    return await db.getSetting<T>(key);
  }

  async setSetting(key: string, value: any): Promise<void> {
    // Save to local cache immediately
    await db.setSetting(key, value);
    
    // Immediately sync to server
    if (this.isOnline) {
      try {
        this.syncInProgress = true;
        const userId = await this.getCurrentUserId();
        if (userId) {
          const response = await fetch(`${API_BASE}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, key, value })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to save setting: ${response.statusText}`);
          }
          
          this.lastSyncTime = Date.now();
        }
      } catch (err) {
        console.error('Failed to sync setting to server:', err);
        // Setting is still saved locally, will retry on next sync
      } finally {
        this.syncInProgress = false;
      }
    }
  }

  async clearAllData(): Promise<void> {
    await db.clearAllData();
    
    if (this.isOnline) {
      try {
        // Note: This would need a separate endpoint or userId-based clearing
        // For now, just clear local
      } catch (err) {
        console.error('Failed to clear data on server:', err);
      }
    }
  }

  async syncFromServer(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;
    
    this.syncInProgress = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(`${API_BASE}/sessions`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error('Failed to fetch sessions');
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        if (text.trim().startsWith('import') || text.trim().startsWith('export')) {
          throw new Error('API returning source code. Use "vercel dev" for local development.');
        }
        throw new Error(`Expected JSON but got ${contentType || 'unknown'}`);
      }

      const data = await response.json();
      const serverSessions: Session[] = data.sessions || [];
      
      // Merge: server wins on conflicts
      for (const serverSession of serverSessions) {
        await db.saveSession(serverSession);
      }
      
      await this.syncSettingsFromServer();
      this.lastSyncTime = Date.now();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Sync timed out');
      } else {
        console.error('Sync failed:', error);
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncToServer(): Promise<void> {
    if (!this.isOnline) return;
    
    try {
      const localSessions = await db.getAllSessions();
      
      // Upload all local sessions to server
      for (const session of localSessions) {
        try {
          await fetch(`${API_BASE}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(session)
          });
        } catch (err) {
          console.error(`Failed to sync session ${session.id}:`, err);
        }
      }
      
      // Sync settings
      await this.syncSettingsToServer();
    } catch (error) {
      console.error('Sync to server failed:', error);
    }
  }

  private async syncSettingsFromServer(): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return;
      
      const response = await fetch(`${API_BASE}/settings?userId=${userId}`);
      if (!response.ok) return;
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) return;

      const data = await response.json();
      const settings = data.settings || {};
      
      for (const [key, value] of Object.entries(settings)) {
        await db.setSetting(key, value);
      }
    } catch (error) {
      console.error('Failed to sync settings from server:', error);
    }
  }

  private async syncSettingsToServer(): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return;
      
      // Get all local settings and sync them
      // Note: We'd need to track which settings exist locally
      // For now, we'll sync the main one (customTarget)
      const customTarget = await db.getSetting<number>('customTarget');
      if (customTarget !== null) {
        await fetch(`${API_BASE}/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, key: 'customTarget', value: customTarget })
        });
      }
    } catch (error) {
      console.error('Failed to sync settings to server:', error);
    }
  }

  private async getCurrentUserId(): Promise<'Yashwanth' | 'Lahari' | null> {
    // Store current user in localStorage or get from app state
    const stored = localStorage.getItem('focusflow_current_user');
    if (stored === 'Yashwanth' || stored === 'Lahari') {
      return stored;
    }
    return null;
  }

  setCurrentUser(userId: 'Yashwanth' | 'Lahari'): void {
    localStorage.setItem('focusflow_current_user', userId);
  }

  startAutoSync(): void {
    if (this.syncInterval) return;
    
    // Only sync FROM server periodically to get other user's updates
    // Local changes are synced immediately via CRUD operations
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncFromServer().catch(err => {
          console.error('Periodic sync failed:', err);
        });
      }
    }, SYNC_INTERVAL);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  getLastSyncTime(): number {
    return this.lastSyncTime;
  }

  isSyncing(): boolean {
    return this.syncInProgress;
  }
}

export const dbSync = new SyncDatabase();

