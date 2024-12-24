import * as Notifications from "expo-notifications";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
} from "react";
import { Platform } from "react-native";

import {
  calculateNextScheduleTime,
  findNextCustomOccurrence,
} from "../domain/habit";
import { clock } from "../services/clock";
import { parseISODateString } from "../types/habit";
import { StoredHabit } from "../types/storage";

interface NotificationContextType {
  scheduleNotification: (habit: StoredHabit) => Promise<string | undefined>;
  cancelNotification: (identifier: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const setupNotifications = useCallback(async () => {
    if (Platform.OS === "web") return;

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("User denied notification permissions");
        return;
      }

      if (Platform.OS === "ios") {
        await Notifications.setNotificationCategoryAsync("habit", [
          {
            identifier: "complete",
            buttonTitle: "✅ Complete",
            options: {
              isAuthenticationRequired: false,
            },
          },
          {
            identifier: "skip",
            buttonTitle: "⏭️ Skip",
            options: {
              isDestructive: true,
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Error initializing notifications:", error);
    }
  }, []);

  const scheduleNotification = useCallback(
    async (habit: StoredHabit): Promise<string | undefined> => {
      if (Platform.OS === "web") return;

      try {
        const notificationTime = new Date(habit.notification.time);
        const currentTime = clock.now();

        const nextTimeResult = calculateNextScheduleTime(
          notificationTime,
          currentTime,
        );
        if (!nextTimeResult.isValid || !nextTimeResult.value) {
          console.error(
            "Failed to calculate next schedule time:",
            nextTimeResult.error,
          );
          return undefined;
        }

        let scheduledDate = parseISODateString(nextTimeResult.value);

        if (habit.occurrence.type === "custom") {
          scheduledDate = findNextCustomOccurrence(
            scheduledDate,
            habit.occurrence.days,
            currentTime.getDay(),
          );
        }

        const content: Notifications.NotificationContentInput = {
          title: habit.name,
          body: habit.notification.message,
          data: {
            habitId: habit.id,
            type: "habit_reminder",
            scheduledTime: scheduledDate.toISOString(),
            targetTime: scheduledDate.toISOString(),
          },
          categoryIdentifier: Platform.OS === "ios" ? "habit" : undefined,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        };

        const trigger: Notifications.NotificationTriggerInput =
          Platform.OS === "ios"
            ? {
              type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
              hour: scheduledDate.getHours(),
              minute: scheduledDate.getMinutes(),
              second: 0,
              repeats: true,
            }
            : {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: Math.max(
                1,
                Math.ceil(
                  (scheduledDate.getTime() - currentTime.getTime()) / 1000,
                ),
              ),
              repeats: false,
            };

        return await Notifications.scheduleNotificationAsync({
          content,
          trigger,
        });
      } catch (error) {
        console.error("Error scheduling notification:", error);
        return undefined;
      }
    },
    [],
  );

  const cancelNotification = useCallback(
    async (identifier: string): Promise<void> => {
      if (Platform.OS === "web") return;

      try {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      } catch (error) {
        console.error("Error canceling notification:", error);
      }
    },
    [],
  );

  const cancelAllNotifications = useCallback(async (): Promise<void> => {
    if (Platform.OS === "web") return;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("Error canceling all notifications:", error);
    }
  }, []);

  useEffect(() => {
    setupNotifications();
  }, [setupNotifications]);

  const value = {
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
