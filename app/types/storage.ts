import { Days } from './habit';

export interface StoredHabit {
  id: string;
  name: string;
  type: 'build' | 'break';
  occurrence: {
    type: 'daily' | 'custom';
    days: Days[];
  };
  notification: {
    message: string;
    time: string; // ISO string
  };
  createdAt: string; // ISO string
  startDate: string; // ISO string
  isActive: boolean;
}

export interface HabitProgress {
  habitId: string;
  date: string; // ISO string
  completed: boolean;
  skipped: boolean;
  notes?: string;
}

export interface StorageKeys {
  HABITS: 'habits';
  PROGRESS: 'progress';
} 