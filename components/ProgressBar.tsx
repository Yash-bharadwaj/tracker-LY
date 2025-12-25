
import React from 'react';

interface ProgressBarProps {
  percentage: number;
  label: string;
  subLabel: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, label, subLabel }) => {
  const size = 288; // 72 * 4 = 288px
  const center = size / 2;
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  
  const isOver = percentage > 100;
  const displayPercentage = Math.min(percentage, 100);
  const offset = circumference - (displayPercentage / 100) * circumference;

  return (
    <div className="relative w-72 h-72 mx-auto flex items-center justify-center">
      {/* Dynamic Glow - positioned behind everything */}
      <div className={`absolute inset-0 rounded-full blur-[80px] opacity-20 transition-all duration-1000 ${
        isOver ? 'bg-orange-500 scale-110' : percentage >= 100 ? 'bg-emerald-500 scale-105' : 'bg-indigo-500'
      }`} />
      
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        className="transform -rotate-90 block overflow-visible drop-shadow-2xl"
      >
        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="14"
          fill="transparent"
        />
        {/* Main Progress Bar */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={isOver ? '#10b981' : percentage >= 100 ? '#10b981' : '#6366f1'}
          strokeWidth="14"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
        {/* Overfill Bonus Bar */}
        {isOver && (
          <circle
            cx={center}
            cy={center}
            r={radius + 18}
            stroke="#f97316"
            strokeWidth="6"
            strokeDasharray={2 * Math.PI * (radius + 18)}
            strokeDashoffset={(2 * Math.PI * (radius + 18)) - (Math.min(percentage - 100, 100) / 100) * (2 * Math.PI * (radius + 18))}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out opacity-80"
          />
        )}
      </svg>
      
      {/* Centering Wrapper: Refined font for absolute fit */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
        <div className="flex flex-col items-center justify-center text-center -mt-6">
          <span className={`text-[2.75rem] font-[900] tracking-tighter tabular-nums leading-none transition-colors duration-500 ${isOver ? 'text-orange-400' : 'text-white'}`}>
            {label}
          </span>
          <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mt-3 whitespace-normal max-w-[120px] text-center leading-tight">
            {subLabel}
          </span>
          {isOver && (
            <div className="mt-4 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-[8px] font-black tracking-widest animate-pulse border border-orange-500/30">
              STREAKING 🔥
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
