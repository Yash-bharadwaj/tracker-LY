
import { Session } from '../types';

export const TARGET_MINUTES = 120; // 2 hours

export const getCurrentDateKey = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const calculateMinutes = (start: string, end: string): number => {
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  
  let startTotal = sH * 60 + sM;
  let endTotal = eH * 60 + eM;
  
  // Handle midnight crossing
  if (endTotal < startTotal) {
    endTotal += 24 * 60;
  }
  
  return endTotal - startTotal;
};

export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const checkOverlaps = (
  newStart: string, 
  newEnd: string, 
  date: string, 
  sessions: Session[], 
  excludeId?: string
): boolean => {
  const nStart = calculateMinutes("00:00", newStart);
  let nEnd = calculateMinutes("00:00", newEnd);
  if (nEnd < nStart) nEnd += 1440;

  return sessions
    .filter(s => s.date === date && s.id !== excludeId)
    .some(s => {
      const sStart = calculateMinutes("00:00", s.startTime);
      let sEnd = calculateMinutes("00:00", s.endTime);
      if (sEnd < sStart) sEnd += 1440;
      
      return (nStart < sEnd && nEnd > sStart);
    });
};

export const isFuture = (date: string, time: string): boolean => {
  const now = new Date();
  const entryDate = new Date(`${date}T${time}`);
  return entryDate > now;
};

export const getStreakData = (sessions: Session[], userId: string) => {
  const userSessions = sessions.filter(s => s.userId === userId);
  if (userSessions.length === 0) return { current: 0, best: 0 };
  
  const dailyMinutes = new Map<string, number>();
  userSessions.forEach(s => {
    dailyMinutes.set(s.date, (dailyMinutes.get(s.date) || 0) + s.durationMinutes);
  });

  const dates = Array.from(dailyMinutes.keys()).sort();
  if (dates.length === 0) return { current: 0, best: 0 };

  let best = 0;
  let current = 0;
  
  // Calculate best streak historically
  let tempStreak = 0;
  const firstSessionDate = new Date(dates[0]);
  const endDate = new Date();
  const cursor = new Date(firstSessionDate);

  while (cursor <= endDate) {
    const key = cursor.toISOString().split('T')[0];
    if ((dailyMinutes.get(key) || 0) >= TARGET_MINUTES) {
      tempStreak++;
    } else {
      best = Math.max(best, tempStreak);
      tempStreak = 0;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  best = Math.max(best, tempStreak);

  // Calculate current streak
  let activeStreak = 0;
  const todayKey = getCurrentDateKey();
  const checkDate = new Date();
  
  // If today isn't done, streak might still be active from yesterday
  if ((dailyMinutes.get(todayKey) || 0) < TARGET_MINUTES) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = checkDate.toISOString().split('T')[0];
    if ((dailyMinutes.get(key) || 0) >= TARGET_MINUTES) {
      activeStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { current: activeStreak, best: best };
};

export const getCalendarActivity = (sessions: Session[], userId: string, days: number = 28) => {
  const activity = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    const dayMinutes = sessions
      .filter(s => s.userId === userId && s.date === dateKey)
      .reduce((acc, s) => acc + s.durationMinutes, 0);
    
    activity.push({
      date: dateKey,
      dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      minutes: dayMinutes,
      isCompleted: dayMinutes >= TARGET_MINUTES
    });
  }
  return activity;
};

export const getHistoryStats = (sessions: Session[], userId: string) => {
  const userSessions = sessions.filter(s => s.userId === userId);
  const now = new Date();
  
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - i);
    return d.toISOString().split('T')[0];
  });

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - i);
    return d.toISOString().split('T')[0];
  });

  const calculateAvg = (days: string[]) => {
    const dailyTotals = days.map(date => 
      userSessions
        .filter(s => s.date === date)
        .reduce((acc, s) => acc + s.durationMinutes, 0)
    );
    const total = dailyTotals.reduce((a, b) => a + b, 0);
    return days.length > 0 ? total / days.length : 0;
  };

  return {
    weeklyAvg: calculateAvg(last7Days),
    monthlyAvg: calculateAvg(last30Days),
    totalHours: userSessions.reduce((acc, s) => acc + s.durationMinutes, 0) / 60
  };
};
