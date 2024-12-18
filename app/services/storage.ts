import AsyncStorage from '@react-native-async-storage/async-storage';
import { StoredHabit, HabitProgress } from '../types/storage';

const STORAGE_KEYS = {
  HABITS: 'habits',
  PROGRESS: 'progress',
} as const;

class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Habits CRUD operations
  async getAllHabits(): Promise<StoredHabit[]> {
    try {
      const habitsJson = await AsyncStorage.getItem(STORAGE_KEYS.HABITS);
      return habitsJson ? JSON.parse(habitsJson) : [];
    } catch (error) {
      console.error('Error getting habits:', error);
      return [];
    }
  }

  async saveHabit(habit: StoredHabit): Promise<boolean> {
    try {
      const habits = await this.getAllHabits();
      const updatedHabits = [...habits, habit];
      await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updatedHabits));
      return true;
    } catch (error) {
      console.error('Error saving habit:', error);
      return false;
    }
  }

  async updateHabit(updatedHabit: StoredHabit): Promise<boolean> {
    try {
      const habits = await this.getAllHabits();
      const updatedHabits = habits.map(habit => 
        habit.id === updatedHabit.id ? updatedHabit : habit
      );
      await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updatedHabits));
      return true;
    } catch (error) {
      console.error('Error updating habit:', error);
      return false;
    }
  }

  async deleteHabit(habitId: string): Promise<boolean> {
    try {
      const habits = await this.getAllHabits();
      const updatedHabits = habits.filter(habit => habit.id !== habitId);
      await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updatedHabits));
      return true;
    } catch (error) {
      console.error('Error deleting habit:', error);
      return false;
    }
  }

  // Progress tracking
  async getHabitProgress(habitId: string, startDate: string, endDate: string): Promise<HabitProgress[]> {
    try {
      const progressJson = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS);
      const allProgress: HabitProgress[] = progressJson ? JSON.parse(progressJson) : [];
      
      return allProgress.filter(progress => 
        progress.habitId === habitId &&
        progress.date >= startDate &&
        progress.date <= endDate
      );
    } catch (error) {
      console.error('Error getting habit progress:', error);
      return [];
    }
  }

  async saveProgress(progress: HabitProgress): Promise<boolean> {
    try {
      const progressJson = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS);
      const allProgress: HabitProgress[] = progressJson ? JSON.parse(progressJson) : [];
      
      // Remove any existing progress for the same habit and date
      const filteredProgress = allProgress.filter(p => 
        !(p.habitId === progress.habitId && p.date === progress.date)
      );
      
      const updatedProgress = [...filteredProgress, progress];
      await AsyncStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(updatedProgress));
      return true;
    } catch (error) {
      console.error('Error saving progress:', error);
      return false;
    }
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.HABITS, STORAGE_KEYS.PROGRESS]);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  async exportData(): Promise<{ habits: StoredHabit[]; progress: HabitProgress[] }> {
    try {
      const habits = await this.getAllHabits();
      const progressJson = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS);
      const progress = progressJson ? JSON.parse(progressJson) : [];
      
      return { habits, progress };
    } catch (error) {
      console.error('Error exporting data:', error);
      return { habits: [], progress: [] };
    }
  }

  async importData(data: { habits: StoredHabit[]; progress: HabitProgress[] }): Promise<boolean> {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.HABITS, JSON.stringify(data.habits)],
        [STORAGE_KEYS.PROGRESS, JSON.stringify(data.progress)]
      ]);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

export const storage = StorageService.getInstance();

export default storage; 