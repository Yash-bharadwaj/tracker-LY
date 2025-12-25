
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, User as UserIcon, Flame, ChevronLeft, ChevronRight, 
  BarChart3, Clock, Trophy, Target, TrendingUp, Menu, Users, Calendar as CalendarIcon, Loader2, Globe
} from 'lucide-react';
import { User, Session } from './types';
import { TARGET_MINUTES, getCurrentDateKey, formatDuration, getStreakData, getHistoryStats } from './utils/timeUtils';
import { dbSync } from './dbSync';
import ProgressBar from './components/ProgressBar';
import SessionItem from './components/SessionItem';
import AddSessionSheet from './components/AddSessionSheet';
import MenuOverlay from './components/MenuOverlay';
import StreakVisualizer from './components/StreakVisualizer';
import GlobalDashboard from './components/GlobalDashboard';

type ViewMode = 'Yashwanth' | 'Lahari' | 'Global';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('Yashwanth');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedDate, setSelectedDate] = useState(getCurrentDateKey());
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStreakPageOpen, setIsStreakPageOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [customTarget, setCustomTarget] = useState(TARGET_MINUTES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initData = async () => {
      await dbSync.init();
      
      // Set current user based on view mode
      const currentUser = viewMode === 'Global' ? 'Yashwanth' : viewMode;
      dbSync.setCurrentUser(currentUser);
      
      // Load from local cache first (fast)
      let allSessions = await dbSync.getAllSessions();
      let target = await dbSync.getSetting<number>('customTarget');
      
      // Migrate old localStorage data if needed
      const oldData = localStorage.getItem('focusflow_v3_state');
      if (allSessions.length === 0 && oldData) {
        try {
          const parsed = JSON.parse(oldData);
          const migratedSessions = parsed.sessions || [];
          const migratedTarget = parsed.customTarget || TARGET_MINUTES;
          for (const s of migratedSessions) { 
            await dbSync.saveSession(s);
          }
          await dbSync.setSetting('customTarget', migratedTarget);
          allSessions = migratedSessions;
          target = migratedTarget;
        } catch (e) { 
          console.error('Migration failed', e); 
        }
      }
      
      setSessions(allSessions);
      if (target) setCustomTarget(target);
      
      // Start auto-sync
      dbSync.startAutoSync();
      
      // Sync from server in background
      dbSync.syncFromServer().then(() => {
        dbSync.getAllSessions().then(updatedSessions => {
          setSessions(updatedSessions);
        });
      });
      
      setIsLoading(false);
    };
    initData();
  }, []);

  // Update current user when view mode changes
  useEffect(() => {
    if (!isLoading) {
      const currentUser = viewMode === 'Global' ? 'Yashwanth' : viewMode;
      dbSync.setCurrentUser(currentUser);
    }
  }, [viewMode, isLoading]);

  // Auto-refresh sync status and fetch other user's updates
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSyncing(dbSync.isSyncing());
      setLastSyncTime(dbSync.getLastSyncTime());
      
      // Refresh sessions from local cache (which gets updated by periodic sync)
      dbSync.getAllSessions().then(updatedSessions => {
        setSessions(updatedSessions);
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSaveSession = async (sessionData: Partial<Session>) => {
    const id = sessionData.id || Math.random().toString(36).substring(2, 10);
    const newSession: Session = {
      ...sessionData as Session,
      id,
      createdAt: sessionData.createdAt || Date.now()
    };
    // Save immediately - syncs to server automatically
    await dbSync.saveSession(newSession);
    setSessions(prev => {
      const exists = prev.find(s => s.id === id);
      if (exists) return prev.map(s => s.id === id ? newSession : s);
      return [...prev, newSession];
    });
    // Update sync status
    setIsSyncing(dbSync.isSyncing());
    setLastSyncTime(dbSync.getLastSyncTime());
  };

  const handleDeleteSession = async (id: string) => {
    // Delete immediately - syncs to server automatically
    await dbSync.deleteSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
    // Update sync status
    setIsSyncing(dbSync.isSyncing());
    setLastSyncTime(dbSync.getLastSyncTime());
  };

  const handleUpdateTarget = async (newTarget: number) => {
    setCustomTarget(newTarget);
    // Update immediately - syncs to server automatically
    await dbSync.setSetting('customTarget', newTarget);
    // Update sync status
    setIsSyncing(dbSync.isSyncing());
    setLastSyncTime(dbSync.getLastSyncTime());
  };

  const handleResetData = async () => {
    if (confirm('DANGER: This will permanently wipe all focus data for BOTH of you. Proceed?')) {
      await dbSync.clearAllData();
      localStorage.removeItem('focusflow_v3_state');
      setSessions([]);
    }
  };

  const shiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const newKey = `${year}-${month}-${day}`;

    if (newKey <= getCurrentDateKey()) {
      setSelectedDate(newKey);
    }
  };

  const openCalendar = () => {
    if (dateInputRef.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        try {
          dateInputRef.current.showPicker();
        } catch (e) {
          dateInputRef.current.click();
        }
      } else {
        dateInputRef.current.click();
      }
    }
  };

  const isToday = selectedDate === getCurrentDateKey();
  const displayDateLabel = useMemo(() => {
    if (isToday) return 'Today';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const [ty, tm, td] = getCurrentDateKey().split('-').map(Number);
    const todayObj = new Date(ty, tm - 1, td);
    const yesterdayObj = new Date(todayObj);
    yesterdayObj.setDate(todayObj.getDate() - 1);
    
    if (dateObj.getTime() === yesterdayObj.getTime()) return 'Yesterday';
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [selectedDate, isToday]);

  const currentActiveUser = viewMode === 'Global' ? 'Yashwanth' : viewMode as User;

  const daySessions = useMemo(() => 
    sessions.filter(s => s.userId === currentActiveUser && s.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
  , [sessions, currentActiveUser, selectedDate]);

  const totalMinutes = useMemo(() => 
    daySessions.reduce((acc, s) => acc + s.durationMinutes, 0)
  , [daySessions]);

  const streakData = useMemo(() => getStreakData(sessions, currentActiveUser), [sessions, currentActiveUser]);
  const teamStats = useMemo(() => {
    const yStats = getHistoryStats(sessions, 'Yashwanth');
    const lStats = getHistoryStats(sessions, 'Lahari');
    const today = getCurrentDateKey();
    const yToday = sessions.filter(s => s.userId === 'Yashwanth' && s.date === today).reduce((acc, s) => acc + s.durationMinutes, 0);
    const lToday = sessions.filter(s => s.userId === 'Lahari' && s.date === today).reduce((acc, s) => acc + s.durationMinutes, 0);
    return {
      yashwanth: { ...yStats, today: yToday },
      lahari: { ...lStats, today: lToday },
      totalTogether: yStats.totalHours + lStats.totalHours
    };
  }, [sessions]);

  const percentage = Math.round((totalMinutes / customTarget) * 100);
  const isGoalReached = totalMinutes >= customTarget;

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Waking Database...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-black text-white overflow-hidden relative selection:bg-indigo-500/30">
      {/* 3-Way Mode Switcher Header */}
      <header className="px-6 pt-10 pb-4 flex flex-col gap-6 z-20">
        <div className="flex items-center justify-between">
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            <button 
              onClick={() => setViewMode('Yashwanth')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'Yashwanth' ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/30'}`}
            >
              Yash
            </button>
            <button 
              onClick={() => setViewMode('Lahari')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'Lahari' ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/30'}`}
            >
              Lahari
            </button>
            <button 
              onClick={() => setViewMode('Global')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'Global' ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/30'}`}
            >
              Team
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {viewMode !== 'Global' && (
              <button onClick={() => setIsStreakPageOpen(true)} className="flex items-center gap-2 bg-orange-500/10 text-orange-500 px-3 py-1.5 rounded-full border border-orange-500/20 active:scale-90 transition-transform">
                <Flame size={14} fill="currentColor" />
                <span className="font-black text-[10px] tracking-widest">{streakData.current}D</span>
              </button>
            )}
            {/* Sync Status Indicator */}
            <div className="flex items-center gap-2">
              {isSyncing ? (
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" title="Syncing..." />
              ) : lastSyncTime > 0 ? (
                <div className="w-2 h-2 rounded-full bg-emerald-500" title={`Last synced: ${new Date(lastSyncTime).toLocaleTimeString()}`} />
              ) : (
                <div className="w-2 h-2 rounded-full bg-white/20" title="Not synced yet" />
              )}
            </div>
            <button onClick={() => setIsMenuOpen(true)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5 active:scale-90 transition-all">
              <Menu size={20} className="text-white/60" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-40">
        {viewMode === 'Global' ? (
          <GlobalDashboard sessions={sessions} teamStats={teamStats} target={customTarget} />
        ) : (
          <>
            <div className="px-6 py-3 sticky top-0 bg-black/80 backdrop-blur-md z-30 border-b border-white/5 mb-6">
               <div className="flex items-center gap-2">
                  <button onClick={() => shiftDate(-1)} className="p-3 bg-white/5 rounded-2xl border border-white/5 active:scale-90 active:bg-white/10 transition-all text-white/40">
                    <ChevronLeft size={20} />
                  </button>
                  <div className="relative flex-1 group">
                     <input 
                       ref={dateInputRef}
                       type="date" 
                       className="absolute inset-0 opacity-0 w-full h-full z-0 pointer-events-none"
                       value={selectedDate}
                       onChange={(e) => setSelectedDate(e.target.value)}
                       max={getCurrentDateKey()}
                     />
                     <button 
                      onClick={openCalendar}
                      className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-white/5 border border-white/5 rounded-2xl active:bg-white/10 transition-colors"
                     >
                        <CalendarIcon size={16} className="text-indigo-400" />
                        <span className="text-sm font-black tracking-tight text-white/90">
                          {displayDateLabel}
                        </span>
                     </button>
                  </div>
                  <button onClick={() => shiftDate(1)} disabled={isToday} className={`p-3 rounded-2xl border transition-all ${isToday ? 'bg-transparent border-transparent opacity-0 pointer-events-none' : 'bg-white/5 border-white/5 active:scale-90 active:bg-white/10 text-white/40'}`}>
                    <ChevronRight size={20} />
                  </button>
                  {!isToday && (
                    <button onClick={() => setSelectedDate(getCurrentDateKey())} className="px-4 py-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-90 transition-transform">
                      Today
                    </button>
                  )}
               </div>
            </div>

            <section className="px-6 py-4 flex flex-col items-center">
              <ProgressBar percentage={percentage} label={formatDuration(totalMinutes)} subLabel="Productive Hours" />
              <div className="grid grid-cols-2 gap-4 w-full mt-10">
                <div className={`rounded-[2rem] p-6 flex flex-col border transition-all duration-500 ${isGoalReached ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={14} className={isGoalReached ? 'text-emerald-400' : 'text-white/40'} />
                    <span className="text-[10px] uppercase font-black tracking-widest text-white/30">Target</span>
                  </div>
                  <span className={`text-xl font-black ${isGoalReached ? 'text-emerald-400' : 'text-white'}`}>{formatDuration(customTarget)}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={14} className="text-white/40" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-white/30">Status</span>
                  </div>
                  <span className={`text-xl font-black ${isGoalReached ? 'text-emerald-400' : totalMinutes > 0 ? 'text-indigo-400' : 'text-rose-500/60'}`}>
                    {isGoalReached ? 'GOLD ✅' : totalMinutes > 0 ? 'PARTIAL' : 'EMPTY ⭕'}
                  </span>
                </div>
              </div>
            </section>

            <section className="px-6 py-8">
              <div className="flex items-center gap-3 mb-6">
                <Users size={20} className="text-indigo-500" />
                <h2 className="text-lg font-black tracking-tighter uppercase">Team Synergy</h2>
              </div>
              <div className="bg-indigo-500/10 rounded-[2.5rem] p-6 border border-indigo-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block mb-1">Combined Effort</span>
                  <span className="text-2xl font-black text-indigo-400">{teamStats.totalTogether.toFixed(1)}h Lifetime</span>
                </div>
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                  <BarChart3 size={24} />
                </div>
              </div>
            </section>

            <section className="px-6">
              <div className="flex justify-between items-end mb-6">
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-indigo-500" />
                  <h2 className="text-lg font-black tracking-tighter uppercase">Timeline</h2>
                </div>
                <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">{daySessions.length} sessions</div>
              </div>
              {daySessions.length > 0 ? (
                <div className="space-y-1">
                  {daySessions.map(session => (
                    <SessionItem key={session.id} session={session} onDelete={handleDeleteSession} onEdit={(s) => { setEditingSession(s); setIsSheetOpen(true); }} />
                  ))}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center bg-white/5 rounded-[3rem] border-2 border-dashed border-white/5 text-center">
                  <Trophy size={48} className="text-white/5 mb-4" />
                  <p className="text-xs font-bold text-white/20 uppercase tracking-widest">No activity logged on {isToday ? 'Today' : selectedDate}</p>
                </div>
              )}
            </section>
          </>
        )}

        <footer className="mt-20 mb-10 px-6 text-center">
          <p className="text-[10px] font-medium text-white/10 uppercase tracking-[0.3em]">designed with love for lahari</p>
        </footer>
      </main>

      {/* Floating Action Button - Only show on personal views */}
      {viewMode !== 'Global' && (
        <div className="fixed bottom-0 left-0 right-0 px-8 pb-10 z-40 pointer-events-none flex justify-center items-center">
          <button onClick={() => { setEditingSession(null); setIsSheetOpen(true); }} className="pointer-events-auto bg-indigo-500 hover:bg-indigo-600 active:scale-90 w-20 h-20 rounded-[2.5rem] flex items-center justify-center shadow-[0_25px_60px_rgba(99,102,241,0.4)] transition-all border-8 border-black group">
            <Plus size={40} className="text-white group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>
      )}

      <AddSessionSheet isOpen={isSheetOpen} onClose={() => { setIsSheetOpen(false); setEditingSession(null); }} onSave={handleSaveSession} userId={currentActiveUser} sessions={sessions} editingSession={editingSession} />
      <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onReset={handleResetData} target={customTarget} setTarget={handleUpdateTarget} sessions={sessions} />
      <StreakVisualizer isOpen={isStreakPageOpen} onClose={() => setIsStreakPageOpen(false)} sessions={sessions} users={['Yashwanth', 'Lahari']} />
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none z-20" />
    </div>
  );
};

export default App;
