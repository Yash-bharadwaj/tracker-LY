
import React from 'react';
import { Trash2, Clock, Edit3, ArrowRight } from 'lucide-react';
import { Session } from '../types';
import { formatDuration } from '../utils/timeUtils';

interface SessionItemProps {
  session: Session;
  onDelete: (id: string) => void;
  onEdit: (session: Session) => void;
}

const SessionItem: React.FC<SessionItemProps> = ({ session, onDelete, onEdit }) => {
  return (
    <div className="group relative overflow-hidden mb-3">
      {/* Background action layer (visual feedback for swipe-like feel) */}
      <div className="absolute inset-0 bg-rose-500/10 flex items-center justify-end px-6 rounded-3xl opacity-0 group-active:opacity-100 transition-opacity">
        <Trash2 className="text-rose-500" size={20} />
      </div>

      <div 
        onClick={() => onEdit(session)}
        className="relative bg-[#1a1a1a] border border-white/5 rounded-3xl p-5 active:bg-[#222] active:scale-[0.97] transition-all duration-200 z-10 flex items-center justify-between"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            <span className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-1">
              {session.startTime} <ArrowRight size={10} className="text-white/20" /> {session.endTime}
            </span>
          </div>
          <h3 className="text-white font-semibold text-lg leading-tight mb-1">{session.task}</h3>
          <div className="flex items-center gap-2">
             <Clock size={12} className="text-indigo-400" />
             <span className="text-xs font-bold text-indigo-400/80">{formatDuration(session.durationMinutes)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(session);
            }}
            className="p-3 text-white/20 hover:text-white transition-colors"
          >
            <Edit3 size={18} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Permanently delete this session?')) {
                onDelete(session.id);
              }
            }}
            className="p-3 text-white/10 hover:text-rose-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionItem;
