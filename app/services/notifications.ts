import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { StoredHabit } from '../types/storage';
import storage from './storage';
import { 
  NotificationTriggerInput,
  CalendarTriggerInput,
  DailyTriggerInput,
  WeeklyTriggerInput,
  SchedulableTriggerInputTypes
} from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private static instance: NotificationService;

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
    if (Platform.OS === 'web') return;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('User denied notification permissions');
        return;
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  private setupNotificationHandler() {
    Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse);
  }

  private handleNotificationResponse = async (response: Notifications.NotificationResponse) => {
    const habitId = response.notification.request.content.data?.habitId;
    if (!habitId) return;

    const actionId = response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
      ? 'press'
      : response.actionIdentifier;

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
          console.log('Notification pressed for habit:', habitId);
          break;
      }

      // Cancel the notification after action is taken
      await Notifications.dismissNotificationAsync(response.notification.request.identifier);
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  };

  async scheduleHabitNotification(habit: StoredHabit): Promise<string | undefined> {
    if (Platform.OS === 'web') {
      console.log('Notifications not supported on web');
      return;
    }

    try {
      const notificationTime = new Date(habit.notification.time);
      
      // Convert days to weekday numbers (1-7, where 1 is Sunday)
      const weekdays = habit.occurrence.days.map(day => {
        const dayMap: { [key: string]: number } = {
          'SUNDAY': 1,
          'MONDAY': 2,
          'TUESDAY': 3,
          'WEDNESDAY': 4,
          'THURSDAY': 5,
          'FRIDAY': 6,
          'SATURDAY': 7
        };
        return dayMap[day];
      });

      let trigger: CalendarTriggerInput | DailyTriggerInput | WeeklyTriggerInput;

      if (Platform.OS === 'ios') {
        // On iOS, use CalendarTriggerInput
        trigger = {
          type: SchedulableTriggerInputTypes.CALENDAR,
          repeats: true,
          hour: notificationTime.getHours(),
          minute: notificationTime.getMinutes(),
          weekday: habit.occurrence.type === 'daily' ? undefined : weekdays[0]
        };
      } else {
        // On Android, schedule multiple weekly notifications if custom days
        if (habit.occurrence.type === 'daily') {
          trigger = {
            type: SchedulableTriggerInputTypes.DAILY,
            hour: notificationTime.getHours(),
            minute: notificationTime.getMinutes(),
          };
        } else {
          // For custom days, we'll need to schedule multiple notifications
          // Start with the first weekday
          trigger = {
            type: SchedulableTriggerInputTypes.WEEKLY,
            weekday: weekdays[0],
            hour: notificationTime.getHours(),
            minute: notificationTime.getMinutes(),
          };
        }
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: habit.name,
          body: habit.notification.message,
          data: {
            habitId: habit.id,
            type: 'habit_reminder',
          },
          categoryIdentifier: 'habit',
        },
        trigger,
      });

      // For Android with custom days, schedule additional notifications for other weekdays
      if (Platform.OS === 'android' && habit.occurrence.type === 'custom' && weekdays.length > 1) {
        for (let i = 1; i < weekdays.length; i++) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: habit.name,
              body: habit.notification.message,
              data: {
                habitId: habit.id,
                type: 'habit_reminder',
              },
              categoryIdentifier: 'habit',
            },
            trigger: {
              type: SchedulableTriggerInputTypes.WEEKLY,
              weekday: weekdays[i],
              hour: notificationTime.getHours(),
              minute: notificationTime.getMinutes(),
            } as WeeklyTriggerInput,
          });
        }
      }

      if (Platform.OS === 'ios') {
        await Notifications.setNotificationCategoryAsync('habit', [
          {
            identifier: 'complete',
            buttonTitle: '✅ Complete',
            options: {
              isAuthenticationRequired: false,
            },
          },
          {
            identifier: 'skip',
            buttonTitle: '⏭️ Skip',
            options: {
              isDestructive: true,
            },
          },
        ]);
      }

      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return undefined;
    }
  }

  async cancelHabitNotification(identifier: string) {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllHabitNotifications() {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  async getScheduledNotifications() {
    if (Platform.OS === 'web') return [];

    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }
}

export const notifications = NotificationService.getInstance();
export default notifications; 