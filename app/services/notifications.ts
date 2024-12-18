import notifee, { 
  TimestampTrigger, 
  TriggerType, 
  AndroidImportance,
  RepeatFrequency,
  AuthorizationStatus,
  AndroidCategory,
  EventType
} from '@notifee/react-native';
import { Platform } from 'react-native';
import { StoredHabit } from '../types/storage';
import storage from './storage';

class NotificationService {
  private static instance: NotificationService;

  private constructor() {
    this.initialize();
    this.setupForegroundHandler();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initialize() {
    if (Platform.OS === 'web') return;

    try {
      const settings = await notifee.requestPermission();

      if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
        console.warn('User denied notification permissions');
        return;
      }

      // Create default notification channel for Android
      if (Platform.OS === 'android') {
        await notifee.createChannel({
          id: 'habits',
          name: 'Habit Reminders',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
          category: AndroidCategory.REMINDER,
        });
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  private setupForegroundHandler() {
    return notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.PRESS:
          this.handleNotificationAction(detail.notification, 'press');
          break;
        case EventType.ACTION_PRESS:
          this.handleNotificationAction(detail.notification, detail.pressAction.id);
          break;
      }
    });
  }

  private async handleNotificationAction(notification: any, actionId: string) {
    if (!notification?.data?.habitId) return;

    const habitId = notification.data.habitId;
    const now = new Date().toISOString();

    try {
      switch (actionId) {
        case 'complete':
          await storage.saveProgress({
            habitId,
            date: now,
            completed: true,
            skipped: false,
          });
          break;
        case 'skip':
          await storage.saveProgress({
            habitId,
            date: now,
            completed: false,
            skipped: true,
          });
          break;
        case 'press':
          // Handle notification press - could navigate to habit details
          console.log('Notification pressed for habit:', habitId);
          break;
      }

      // Cancel the notification after action is taken
      if (notification.id) {
        await notifee.cancelNotification(notification.id);
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  }

  async scheduleHabitNotification(habit: StoredHabit): Promise<string | undefined> {
    if (Platform.OS === 'web') {
      console.log('Notifications not supported on web');
      return;
    }

    try {
      // Parse notification time
      const notificationTime = new Date(habit.notification.time);
      const now = new Date();
      
      // Create trigger time for today
      const trigger = new Date(now);
      trigger.setHours(notificationTime.getHours());
      trigger.setMinutes(notificationTime.getMinutes());
      trigger.setSeconds(0);
      trigger.setMilliseconds(0);
      
      // If time has passed for today, schedule for tomorrow
      if (trigger <= now) {
        trigger.setDate(trigger.getDate() + 1);
      }

      // Create the time-based trigger
      const timestampTrigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: trigger.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      };

      // Create the notification content
      const channelId = Platform.OS === 'android' ? 'habits' : undefined;
      
      // Schedule the notification
      const notificationId = await notifee.createTriggerNotification(
        {
          title: habit.name,
          body: habit.notification.message,
          android: {
            channelId,
            pressAction: {
              id: 'default',
            },
            actions: [
              {
                title: '✅ Complete',
                pressAction: {
                  id: 'complete',
                },
              },
              {
                title: '⏭️ Skip',
                pressAction: {
                  id: 'skip',
                },
              },
            ],
          },
          ios: {
            categoryId: 'habit',
            attachments: [],
            critical: true,
            sound: 'default',
          },
          data: {
            habitId: habit.id,
            type: 'habit_reminder',
          },
        },
        timestampTrigger,
      );

      // Set up iOS notification category if not already done
      if (Platform.OS === 'ios') {
        await notifee.setNotificationCategories([
          {
            id: 'habit',
            actions: [
              {
                id: 'complete',
                title: 'Complete',
                foreground: true,
              },
              {
                id: 'skip',
                title: 'Skip',
                foreground: true,
                destructive: true,
              },
            ],
          },
        ]);
      }

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return undefined;
    }
  }

  async cancelHabitNotification(identifier: string) {
    if (Platform.OS === 'web') return;

    try {
      await notifee.cancelNotification(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllHabitNotifications() {
    if (Platform.OS === 'web') return;

    try {
      await notifee.cancelAllNotifications();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  async getScheduledNotifications() {
    if (Platform.OS === 'web') return [];

    try {
      return await notifee.getTriggerNotifications();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }
}

// Set up background handler
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const notification = detail.notification;
  
  if (!notification) return;

  switch (type) {
    case EventType.PRESS:
      await notifications.handleNotificationAction(notification, 'press');
      break;
    case EventType.ACTION_PRESS:
      await notifications.handleNotificationAction(notification, detail.pressAction.id);
      break;
  }
});

export const notifications = NotificationService.getInstance();

export default notifications; 