
import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Session, User } from '../types';
import { calculateMinutes, checkOverlaps, getCurrentDateKey, isFuture } from '../utils/timeUtils';

interface AddSessionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: Partial<Session>) => void;
  userId: User;
  sessions: Session[];
  editingSession?: Session | null;
}

const AddSessionSheet: React.FC<AddSessionSheetProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  userId, 
  sessions,
  editingSession 
}) => {
  const [date, setDate] = useState(getCurrentDateKey());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [task, setTask] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingSession) {
      setDate(editingSession.date);
      setStartTime(editingSession.startTime);
      setEndTime(editingSession.endTime);
      setTask(editingSession.task);
    } else {
      const now = new Date();
      const format = (d: number) => d.toString().padStart(2, '0');
      const h = now.getHours();
      const m = now.getMinutes();
      
      setStartTime(`${format(h)}:${format(m)}`);
      const end = new Date(now.getTime() + 60 * 60000);
      setEndTime(`${format(end.getHours())}:${format(end.getMinutes())}`);
      setTask('');
    }
    setError('');
  }, [editingSession, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!startTime || !endTime || !task.trim()) {
      setError('Please provide a task name and valid times.');
      return;
    }

    if (isFuture(date, startTime)) {
      setError('Cannot record focus for the future.');
      return;
    }

    const duration = calculateMinutes(startTime, endTime);
    if (duration <= 0) {
      setError('End time must follow start time.');
      return;
    }

    if (checkOverlaps(startTime, endTime, date, sessions, editingSession?.id)) {
      setError('Conflict detected! This time is already booked.');
      return;
    }

    onSave({
      id: editingSession?.id,
      userId,
      date,
      startTime,
      endTime,
      task: task.trim(),
      durationMinutes: duration,
      createdAt: editingSession?.createdAt || Date.now()
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md pointer-events-auto transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-[#0a0a0a] border-t border-white/10 rounded-t-[2rem] sm:rounded-t-[3rem] p-5 sm:p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 transform translate-y-0 pointer-events-auto max-h-[90vh] overflow-y-auto">
        <div className="w-10 sm:w-12 h-1 sm:h-1.5 bg-white/10 rounded-full mx-auto mb-5 sm:mb-8" />
        
        <div className="flex justify-between items-center mb-6 sm:mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter">
              {editingSession ? 'Adjust' : 'Log Focus'}
            </h2>
            <p className="text-white/40 text-xs sm:text-sm font-medium">Session for {userId}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 sm:w-10 sm:h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 active:scale-90 transition-transform">
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-8">
          <div>
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="What did you achieve?"
              className="w-full bg-white/5 border-b-2 border-white/10 py-3 sm:py-4 text-lg sm:text-2xl font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-indigo-500 transition-all"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[9px] sm:text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Date</label>
              <input
                type="date"
                value={date}
                max={getCurrentDateKey()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[9px] sm:text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-[9px] sm:text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 [color-scheme:dark]"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl sm:rounded-2xl text-rose-400 text-xs sm:text-sm font-bold animate-shake">
              <AlertCircle size={16} className="sm:w-4.5 sm:h-4.5" />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-500 hover:bg-indigo-600 active:scale-95 py-4 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] text-white font-black text-base sm:text-xl shadow-[0_15px_30px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center gap-2 sm:gap-3"
          >
            <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
            Commit Session
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddSessionSheet;
