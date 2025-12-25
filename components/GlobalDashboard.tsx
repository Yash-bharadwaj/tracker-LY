
import React from 'react';
import { Session } from '../types';
import { formatDuration, getStreakData } from '../utils/timeUtils';
import { BarChart3, TrendingUp, Award, Clock, Calendar, Globe, Users, Target } from 'lucide-react';

interface GlobalDashboardProps {
  sessions: Session[];
  teamStats: any;
  target: number;
}

const GlobalDashboard: React.FC<GlobalDashboardProps> = ({ sessions, teamStats, target }) => {
  const yStreak = getStreakData(sessions, 'Yashwanth');
  const lStreak = getStreakData(sessions, 'Lahari');

  const yProgress = Math.min(100, Math.round((teamStats.yashwanth.today / target) * 100));
  const lProgress = Math.min(100, Math.round((teamStats.lahari.today / target) * 100));

  return (
    <div className="px-4 sm:px-6 space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-right duration-500">
      {/* Team Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-8 shadow-2xl shadow-indigo-500/20 border border-white/20">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Globe size={20} className="sm:w-6 sm:h-6 text-white/80" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-white/60">The Collective Power</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-black tracking-tighter text-white">{teamStats.totalTogether.toFixed(1)}</span>
          <span className="text-lg sm:text-xl font-bold text-white/50 tracking-tight">Hours Focused</span>
        </div>
        <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-black/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10">
            <span className="text-[9px] sm:text-[9px] font-black text-white/30 uppercase block mb-1">Lifetime Sessions</span>
            <span className="text-base sm:text-lg font-black text-white">{sessions.length}</span>
          </div>
          <div className="bg-black/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10">
            <span className="text-[9px] sm:text-[9px] font-black text-white/30 uppercase block mb-1">Team Target</span>
            <span className="text-base sm:text-lg font-black text-white">{formatDuration(target * 2)}</span>
          </div>
        </div>
      </section>

      {/* Side-by-Side Today Comparison */}
      <section className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <TrendingUp size={18} className="sm:w-5 sm:h-5 text-indigo-400" />
          <h2 className="text-base sm:text-lg font-black uppercase tracking-tighter">Today's Race</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {/* Yashwanth Card */}
          <div className="bg-white/5 border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <span className="font-black text-base sm:text-lg tracking-tight">Yashwanth</span>
              <span className="text-indigo-400 font-black text-sm sm:text-base">{yProgress}%</span>
            </div>
            <div className="w-full h-2.5 sm:h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 mb-2.5 sm:mb-3">
              <div 
                className="h-full bg-indigo-500 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                style={{ width: `${yProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/30">
              <span>{formatDuration(teamStats.yashwanth.today)} done</span>
              <span>{formatDuration(target)} goal</span>
            </div>
          </div>

          {/* Lahari Card */}
          <div className="bg-white/5 border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <span className="font-black text-base sm:text-lg tracking-tight">Lahari</span>
              <span className="text-purple-400 font-black text-sm sm:text-base">{lProgress}%</span>
            </div>
            <div className="w-full h-2.5 sm:h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 mb-2.5 sm:mb-3">
              <div 
                className="h-full bg-purple-500 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                style={{ width: `${lProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/30">
              <span>{formatDuration(teamStats.lahari.today)} done</span>
              <span>{formatDuration(target)} goal</span>
            </div>
          </div>
        </div>
      </section>

      {/* Streak Comparison */}
      <section className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Award size={18} className="sm:w-5 sm:h-5 text-orange-500" />
          <h2 className="text-base sm:text-lg font-black uppercase tracking-tighter">The Consistency Wall</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-orange-500/5 border border-orange-500/10 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 text-center">
            <span className="text-[9px] sm:text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-2">Yash Streak</span>
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
               <span className="text-2xl sm:text-3xl font-black text-orange-500">{yStreak.current}</span>
               <span className="text-xs sm:text-sm font-bold text-orange-500/40">DAYS</span>
            </div>
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-orange-500/10 text-[8px] font-black text-white/20 uppercase tracking-widest">
              Best: {yStreak.best}D
            </div>
          </div>

          <div className="bg-orange-500/5 border border-orange-500/10 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 text-center">
            <span className="text-[9px] sm:text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-2">Lahari Streak</span>
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
               <span className="text-2xl sm:text-3xl font-black text-orange-500">{lStreak.current}</span>
               <span className="text-xs sm:text-sm font-bold text-orange-500/40">DAYS</span>
            </div>
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-orange-500/10 text-[8px] font-black text-white/20 uppercase tracking-widest">
              Best: {lStreak.best}D
            </div>
          </div>
        </div>
      </section>

      {/* Historical Averages Dashboard */}
      <section className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Calendar size={18} className="sm:w-5 sm:h-5 text-emerald-400" />
          <h2 className="text-base sm:text-lg font-black uppercase tracking-tighter">Pacing & Flow</h2>
        </div>
        
        <div className="bg-white/5 border border-white/5 rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-8">
           <div className="space-y-6 sm:space-y-8">
              <div>
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/40">Averages</span>
                  <div className="flex gap-3 sm:gap-4">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-500" />
                      <span className="text-[8px] font-black text-white/30 uppercase">Yash</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-500" />
                      <span className="text-[8px] font-black text-white/30 uppercase">Lahari</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 sm:gap-10">
                   <div className="space-y-4 sm:space-y-6">
                      <div className="group">
                        <span className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase block mb-1">Weekly Pacing</span>
                        <div className="flex items-end gap-1 mb-1.5 sm:mb-2">
                          <span className="text-lg sm:text-xl font-black text-white">{formatDuration(teamStats.yashwanth.weeklyAvg)}</span>
                          <span className="text-[7px] sm:text-[8px] font-bold text-white/20 mb-1">/DAY</span>
                        </div>
                        <div className="w-full h-1 sm:h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (teamStats.yashwanth.weeklyAvg / target) * 100)}%` }} />
                        </div>
                      </div>
                      <div className="group">
                        <span className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase block mb-1">Monthly Flow</span>
                        <div className="flex items-end gap-1 mb-1.5 sm:mb-2">
                          <span className="text-lg sm:text-xl font-black text-white">{formatDuration(teamStats.yashwanth.monthlyAvg)}</span>
                          <span className="text-[7px] sm:text-[8px] font-bold text-white/20 mb-1">/DAY</span>
                        </div>
                        <div className="w-full h-1 sm:h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500/60" style={{ width: `${Math.min(100, (teamStats.yashwanth.monthlyAvg / target) * 100)}%` }} />
                        </div>
                      </div>
                   </div>

                   <div className="space-y-4 sm:space-y-6">
                      <div className="group">
                        <span className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase block mb-1">Weekly Pacing</span>
                        <div className="flex items-end gap-1 mb-1.5 sm:mb-2">
                          <span className="text-lg sm:text-xl font-black text-white">{formatDuration(teamStats.lahari.weeklyAvg)}</span>
                          <span className="text-[7px] sm:text-[8px] font-bold text-white/20 mb-1">/DAY</span>
                        </div>
                        <div className="w-full h-1 sm:h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: `${Math.min(100, (teamStats.lahari.weeklyAvg / target) * 100)}%` }} />
                        </div>
                      </div>
                      <div className="group">
                        <span className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase block mb-1">Monthly Flow</span>
                        <div className="flex items-end gap-1 mb-1.5 sm:mb-2">
                          <span className="text-lg sm:text-xl font-black text-white">{formatDuration(teamStats.lahari.monthlyAvg)}</span>
                          <span className="text-[7px] sm:text-[8px] font-bold text-white/20 mb-1">/DAY</span>
                        </div>
                        <div className="w-full h-1 sm:h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500/60" style={{ width: `${Math.min(100, (teamStats.lahari.monthlyAvg / target) * 100)}%` }} />
                        </div>
                      </div>
                   </div>
                </div>
              </div>
           </div>
        </div>
      </section>

      {/* Motivational Bottom Sheet */}
      <section className="py-6 sm:py-10 text-center">
         <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-white/5 rounded-full border border-white/5">
            <Award size={12} className="sm:w-3.5 sm:h-3.5 text-yellow-500" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Version 3.2 Live Synergy</span>
         </div>
      </section>
    </div>
  );
};

export default GlobalDashboard;
