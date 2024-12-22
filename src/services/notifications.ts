import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import storage from "@/src/services/storage";
import {
  handleNotificationReceived,
  handleNotificationResponse,
} from "@/src/services/notifications/handlers";
import { shouldShowNotification } from "@/src/services/notifications/utils";
import { NotificationConfig } from "@/src/services/notifications/types";
import {
  scheduleHabitNotification,
  cancelHabitNotification,
  cancelAllHabitNotifications,
  getScheduledNotifications,
} from "@/src/services/notifications/scheduler";

class NotificationService {
  private static instance: NotificationService;
  private notificationListener: Notifications.EventSubscription | null = null;
  private responseListener: Notifications.EventSubscription | null = null;

  private constructor() {
    this.initialize();
    this.setupNotificationHandler();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initialize() {
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

      await this.cancelAllHabitNotifications();

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
  }

  private getDefaultNotificationConfig = (show = true): NotificationConfig => ({
    shouldShowAlert: show,
    shouldPlaySound: show,
    shouldSetBadge: show,
  });

  private setupNotificationHandler() {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }

    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        try {
          const habitId = notification.request.content.data?.habitId;
          if (!habitId) return this.getDefaultNotificationConfig();

          const habit = await storage.getHabit(habitId);
          if (!habit) return this.getDefaultNotificationConfig();

          const shouldShow = await shouldShowNotification(habit);
          return this.getDefaultNotificationConfig(shouldShow);
        } catch (error) {
          console.error("Error in notification handler:", error);
          return this.getDefaultNotificationConfig();
        }
      },
    });

    this.notificationListener = Notifications.addNotificationReceivedListener(
      handleNotificationReceived,
    );
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse,
      );
  }

  cleanup() {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }

  // Public API
  scheduleHabitNotification = scheduleHabitNotification;
  cancelHabitNotification = cancelHabitNotification;
  cancelAllHabitNotifications = cancelAllHabitNotifications;
  getScheduledNotifications = getScheduledNotifications;
}

export const notifications = NotificationService.getInstance();
export default notifications;
