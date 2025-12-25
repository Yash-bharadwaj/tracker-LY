
export type User = 'Yashwanth' | 'Lahari';

export interface Session {
  id: string;
  userId: User;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  task: string;
  durationMinutes: number;
  createdAt: number;
}

export interface DayStats {
  totalMinutes: number;
  remainingMinutes: number;
  status: 'completed' | 'partial' | 'missed';
  percentage: number;
}

export interface GlobalStats {
  streak: number;
  weeklyAverage: number;
  totalHours: number;
}
