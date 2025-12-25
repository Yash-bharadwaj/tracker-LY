
import React from 'react';
import { X, Flame, Trophy, Calendar, Zap, TrendingUp, Users } from 'lucide-react';
import { Session, User } from '../types';
import { getStreakData, getCalendarActivity, formatDuration } from '../utils/timeUtils';

interface StreakVisualizerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  users: User[];
}

const StreakVisualizer: React.FC<StreakVisualizerProps> = ({ isOpen, onClose, sessions, users }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-500">
      <header className="px-4 sm:px-6 pt-8 sm:pt-12 pb-4 sm:pb-6 flex justify-between items-center sticky top-0 bg-black/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-orange-500">
            <Flame size={18} className="sm:w-5 sm:h-5" fill="currentColor" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tighter">Consistency</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-2 sm:p-3 bg-white/5 rounded-full text-white/40 active:scale-90 transition-transform"
        >
          <X size={20} className="sm:w-6 sm:h-6" />
        </button>
      </header>

      <main className="px-4 sm:px-6 pb-12 sm:pb-20 space-y-6 sm:space-y-10">
        {users.map((user) => {
          const streak = getStreakData(sessions, user);
          const activity = getCalendarActivity(sessions, user, 28);
          
          return (
            <section key={user} className="space-y-4 sm:space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-lg sm:text-xl font-black tracking-tight mb-1">{user}</h3>
                  <p className="text-[9px] sm:text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Activity Map (28D)</p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-orange-500">
                  <Zap size={12} className="sm:w-3.5 sm:h-3.5" fill="currentColor" />
                  <span className="font-black text-base sm:text-lg">{streak.current}D Streak</span>
                </div>
              </div>

              {/* Grid Visualizer */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 p-4 sm:p-6 bg-white/5 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 shadow-inner">
                {activity.map((day, i) => (
                  <div key={day.date} className="flex flex-col items-center gap-1.5 sm:gap-2">
                    <div 
                      className={`w-full aspect-square rounded-md sm:rounded-lg transition-all duration-700 ${
                        day.isCompleted 
                        ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                        : day.minutes > 0 
                        ? 'bg-indigo-500/40' 
                        : 'bg-white/5'
                      }`}
                    />
                    <span className="text-[7px] sm:text-[8px] font-black text-white/20 uppercase">{day.dayName}</span>
                  </div>
                ))}
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                 <div className="bg-white/5 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/5 flex items-center gap-3 sm:gap-4">
                   <div className="text-white/20"><Trophy size={16} className="sm:w-4.5 sm:h-4.5" /></div>
                   <div>
                     <span className="text-[8px] sm:text-[9px] font-bold text-white/20 uppercase block">Best Ever</span>
                     <span className="text-base sm:text-lg font-black">{streak.best} Days</span>
                   </div>
                 </div>
                 <div className="bg-white/5 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/5 flex items-center gap-3 sm:gap-4">
                   <div className="text-white/20"><TrendingUp size={16} className="sm:w-4.5 sm:h-4.5" /></div>
                   <div>
                     <span className="text-[8px] sm:text-[9px] font-bold text-white/20 uppercase block">Focus Rate</span>
                     <span className="text-base sm:text-lg font-black">
                       {Math.round((activity.filter(a => a.isCompleted).length / 28) * 100)}%
                     </span>
                   </div>
                 </div>
              </div>
            </section>
          );
        })}

        {/* Comparison Insight */}
        <section className="bg-gradient-to-br from-indigo-500/20 to-purple-600/20 p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-white/10">
           <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
             <Users size={18} className="sm:w-5 sm:h-5 text-indigo-400" />
             <span className="text-[10px] sm:text-xs font-black text-indigo-400 uppercase tracking-widest">Growth Together</span>
           </div>
           <p className="text-white/60 text-xs sm:text-sm leading-relaxed font-medium">
             Consistency is the only bridge between dreams and reality. Keep pushing each other, Yash & Lahari.
           </p>
        </section>
      </main>
    </div>
  );
};

export default StreakVisualizer;
