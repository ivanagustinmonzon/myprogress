import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";
import { Platform } from "react-native";
import storage from "../services/storage";
import notifications from "../services/notifications";
import { StoredHabit, HabitProgress } from "../types/storage";
import { validateHabit, needsNotificationUpdate } from "../domain/habit";
import { clock } from "../services/clock";

interface HabitContextType {
  habits: StoredHabit[];
  isLoading: boolean;
  error: string | null;
  refreshHabits: () => Promise<void>;
  saveHabit: (habit: StoredHabit) => Promise<boolean>;
  updateHabit: (habit: StoredHabit) => Promise<boolean>;
  deleteHabit: (habitId: string) => Promise<boolean>;
  saveProgress: (progress: HabitProgress) => Promise<boolean>;
}

const HabitContext = createContext<HabitContextType | null>(null);

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error("useHabits must be used within a HabitProvider");
  }
  return context;
};

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [habits, setHabits] = useState<StoredHabit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshHabits = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allHabits = await storage.getAllHabits();
      setHabits(allHabits);
    } catch (err) {
      setError("Failed to load habits");
      console.error("Error loading habits:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveHabit = useCallback(
    async (habit: StoredHabit): Promise<boolean> => {
      try {
        if (!validateHabit(habit)) {
          setError("Invalid habit data");
          return false;
        }

        if (Platform.OS !== "web") {
          const identifier = await notifications.scheduleHabitNotification({
            habit,
            currentTime: clock.now(),
          });
          if (identifier) {
            habit.notification.identifier = identifier;
          }
        }

        const success = await storage.saveHabit(habit);
        if (success) {
          await refreshHabits();
        }
        return success;
      } catch (err) {
        setError("Failed to save habit");
        console.error("Error saving habit:", err);
        return false;
      }
    },
    [refreshHabits],
  );

  const updateHabit = useCallback(
    async (updatedHabit: StoredHabit): Promise<boolean> => {
      try {
        if (!validateHabit(updatedHabit)) {
          setError("Invalid habit data");
          return false;
        }

        const oldHabit = habits.find((h) => h.id === updatedHabit.id);
        if (!oldHabit) {
          setError("Habit not found");
          return false;
        }

        if (
          Platform.OS !== "web" &&
          needsNotificationUpdate(oldHabit, updatedHabit)
        ) {
          if (updatedHabit.notification.identifier) {
            await notifications.cancelHabitNotification(
              updatedHabit.notification.identifier,
            );
          }

          const identifier = await notifications.scheduleHabitNotification({
            habit: updatedHabit,
            currentTime: clock.now(),
          });
          if (identifier) {
            updatedHabit.notification.identifier = identifier;
          }
        }

        const success = await storage.updateHabit(updatedHabit);
        if (success) {
          await refreshHabits();
        }
        return success;
      } catch (err) {
        setError("Failed to update habit");
        console.error("Error updating habit:", err);
        return false;
      }
    },
    [habits, refreshHabits],
  );

  const deleteHabit = useCallback(
    async (habitId: string): Promise<boolean> => {
      try {
        const habit = habits.find((h) => h.id === habitId);
        if (!habit) {
          setError("Habit not found");
          return false;
        }

        if (Platform.OS !== "web" && habit.notification.identifier) {
          await notifications.cancelHabitNotification(
            habit.notification.identifier,
          );
        }

        const success = await storage.deleteHabit(habitId);
        if (success) {
          await refreshHabits();
        }
        return success;
      } catch (err) {
        setError("Failed to delete habit");
        console.error("Error deleting habit:", err);
        return false;
      }
    },
    [habits, refreshHabits],
  );

  const saveProgress = useCallback(
    async (progress: HabitProgress): Promise<boolean> => {
      try {
        const success = await storage.saveProgress(progress);
        if (success) {
          await refreshHabits();
        }
        return success;
      } catch (err) {
        setError("Failed to save progress");
        console.error("Error saving progress:", err);
        return false;
      }
    },
    [refreshHabits],
  );

  useEffect(() => {
    refreshHabits();
  }, [refreshHabits]);

  const value = {
    habits,
    isLoading,
    error,
    refreshHabits,
    saveHabit,
    updateHabit,
    deleteHabit,
    saveProgress,
  };

  return (
    <HabitContext.Provider value={value}>{children}</HabitContext.Provider>
  );
};
