
import React, { useMemo } from 'react';
import { X, Target, Palette, Trash2, Zap, Users } from 'lucide-react';
import { Session } from '../types';
import { getHistoryStats, formatDuration } from '../utils/timeUtils';

interface MenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
  target: number;
  setTarget: (val: number) => void;
  sessions: Session[];
}

const MenuOverlay: React.FC<MenuOverlayProps> = ({ 
  isOpen, 
  onClose, 
  onReset, 
  target, 
  setTarget, 
  sessions 
}) => {
  if (!isOpen) return null;

  const stats = useMemo(() => {
    const yStats = getHistoryStats(sessions, 'Yashwanth');
    const lStats = getHistoryStats(sessions, 'Lahari');
    
    return {
      yashwanth: yStats,
      lahari: lStats,
      total: yStats.totalHours + lStats.totalHours,
    };
  }, [sessions]);

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-end pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-xl pointer-events-auto transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-sm h-full bg-[#0a0a0a] border-l border-white/10 p-8 shadow-2xl pointer-events-auto overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-black tracking-tighter text-white">Advanced</h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/40 active:scale-90">
            <X size={20} />
          </button>
        </div>

        {/* Team Dashboard */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[2.5rem] p-8 mb-10">
           <div className="flex items-center gap-3 mb-6">
             <Users size={20} className="text-indigo-400" />
             <span className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.2em]">Team Dashboard</span>
           </div>
           
           <div className="space-y-10">
              {/* Yashwanth Profile */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black text-white/40 uppercase tracking-widest">Yashwanth</span>
                  <span className="text-xl font-black text-white">{stats.yashwanth.totalHours.toFixed(1)}h Total</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-white/5 p-3 rounded-2xl">
                     <span className="text-[8px] font-bold text-white/20 uppercase block">Weekly Avg</span>
                     <span className="text-xs font-black">{formatDuration(stats.yashwanth.weeklyAvg)}</span>
                   </div>
                   <div className="bg-white/5 p-3 rounded-2xl">
                     <span className="text-[8px] font-bold text-white/20 uppercase block">Monthly Avg</span>
                     <span className="text-xs font-black">{formatDuration(stats.yashwanth.monthlyAvg)}</span>
                   </div>
                </div>
              </div>

              {/* Lahari Profile */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black text-white/40 uppercase tracking-widest">Lahari</span>
                  <span className="text-xl font-black text-white">{stats.lahari.totalHours.toFixed(1)}h Total</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-white/5 p-3 rounded-2xl">
                     <span className="text-[8px] font-bold text-white/20 uppercase block">Weekly Avg</span>
                     <span className="text-xs font-black">{formatDuration(stats.lahari.weeklyAvg)}</span>
                   </div>
                   <div className="bg-white/5 p-3 rounded-2xl">
                     <span className="text-[8px] font-bold text-white/20 uppercase block">Monthly Avg</span>
                     <span className="text-xs font-black">{formatDuration(stats.lahari.monthlyAvg)}</span>
                   </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Team Combined</span>
                  <span className="text-2xl font-black text-white">{stats.total.toFixed(1)}h</span>
                </div>
              </div>
           </div>
        </div>

        <div className="space-y-10">
          {/* Goal Adjustment */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-white/40">
              <Target size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Global Focus Goal</span>
            </div>
            <div className="flex flex-col gap-4">
              <input 
                type="range" 
                min="30" 
                max="480" 
                step="30"
                value={target} 
                onChange={(e) => setTarget(parseInt(e.target.value))}
                className="w-full accent-indigo-500 h-2 bg-white/5 rounded-full appearance-none cursor-pointer" 
              />
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white/20 uppercase tracking-widest">Session Target</span>
                <span className="text-xl font-black text-indigo-400">{(target/60).toFixed(1)}h</span>
              </div>
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Settings / Actions */}
          <div className="space-y-3">
            <button 
              onClick={() => alert('Custom Themes: Coming in v4 🌈')}
              className="w-full flex items-center justify-between p-6 bg-white/5 rounded-[2rem] active:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-4 text-white/80">
                <Palette size={20} className="text-purple-400" />
                <span className="font-bold">Visual Theme</span>
              </div>
              <div className="w-5 h-5 rounded-full bg-indigo-500 border-2 border-white/10" />
            </button>

            <button 
              onClick={() => {
                onReset();
                onClose();
              }}
              className="w-full flex items-center gap-4 p-6 text-rose-500/40 hover:text-rose-500 active:text-rose-600 transition-colors bg-rose-500/5 rounded-[2rem]"
            >
              <Trash2 size={20} />
              <span className="font-black text-xs uppercase tracking-widest">Nuke History</span>
            </button>
          </div>
        </div>

        <div className="mt-24 text-center">
           <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">FocusFlow v3.2 Premium</p>
           <p className="text-[8px] font-bold text-white/5 uppercase mt-2">Built for Yash & Lahari</p>
        </div>
      </div>
    </div>
  );
};

export default MenuOverlay;
