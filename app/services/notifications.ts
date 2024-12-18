import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { StoredHabit } from '../types/storage';
import storage from './storage';
import { 
  NotificationTriggerInput,
  DateTriggerInput,
  SchedulableTriggerInputTypes,
  WeeklyTriggerInput,
  DailyTriggerInput
} from 'expo-notifications';

class NotificationService {
  private static instance: NotificationService;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

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

      // Remove any existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Set up notification categories for iOS
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
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  private setupNotificationHandler() {
    // Clean up any existing listeners
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }

    // Set up the notification handler
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        try {
          // For custom occurrence, check if notification should be shown today
          const habitId = notification.request.content.data?.habitId;
          if (habitId) {
            const habit = await storage.getHabit(habitId);
            if (habit && habit.occurrence.type === 'custom') {
              const dayMap: { [key: string]: number } = {
                'SUNDAY': 0,
                'MONDAY': 1,
                'TUESDAY': 2,
                'WEDNESDAY': 3,
                'THURSDAY': 4,
                'FRIDAY': 5,
                'SATURDAY': 6
              };
              const selectedDays = habit.occurrence.days.map(day => dayMap[day]);
              const currentDay = new Date().getDay();
              
              if (!selectedDays.includes(currentDay)) {
                return {
                  shouldShowAlert: false,
                  shouldPlaySound: false,
                  shouldSetBadge: false,
                };
              }
            }
          }

          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          };
        } catch (error) {
          console.error('Error in notification handler:', error);
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          };
        }
      }
    });

    // Set up notification received listener
    this.notificationListener = Notifications.addNotificationReceivedListener(this.handleNotificationReceived);
    
    // Set up response listener
    this.responseListener = Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse);
  }

  private handleNotificationReceived = async (notification: Notifications.Notification) => {
    const habitId = notification.request.content.data?.habitId;
    const scheduledTime = notification.request.content.data?.scheduledTime;
    
    if (habitId && scheduledTime) {
      // Schedule next notification
      const habit = await storage.getHabit(habitId);
      if (habit) {
        const nextScheduledTime = new Date(scheduledTime);
        nextScheduledTime.setDate(nextScheduledTime.getDate() + 1);
        
        await this.scheduleHabitNotification({
          ...habit,
          notification: {
            ...habit.notification,
            time: nextScheduledTime.toISOString()
          }
        });
      }
    }
  };

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
      const now = new Date();
      
      // Set notification time for today
      const scheduledTime = new Date(now);
      scheduledTime.setHours(notificationTime.getHours());
      scheduledTime.setMinutes(notificationTime.getMinutes());
      scheduledTime.setSeconds(0);
      scheduledTime.setMilliseconds(0);

      // If the time has passed for today, schedule for tomorrow
      if (scheduledTime.getTime() <= now.getTime()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      // For custom days, find the next occurrence
      if (habit.occurrence.type === 'custom') {
        const dayMap: { [key: string]: number } = {
          'SUNDAY': 0,
          'MONDAY': 1,
          'TUESDAY': 2,
          'WEDNESDAY': 3,
          'THURSDAY': 4,
          'FRIDAY': 5,
          'SATURDAY': 6
        };
        
        const selectedDays = habit.occurrence.days.map(day => dayMap[day]);
        const currentDay = scheduledTime.getDay();
        
        // Find the next selected day
        let daysToAdd = 0;
        let found = false;
        
        for (let i = 0; i < 7; i++) {
          const checkDay = (currentDay + i) % 7;
          if (selectedDays.includes(checkDay)) {
            daysToAdd = i;
            found = true;
            break;
          }
        }
        
        if (!found) {
          console.error('No valid days selected for notification');
          return undefined;
        }
        
        scheduledTime.setDate(scheduledTime.getDate() + daysToAdd);
      }

      console.log('Scheduling notification for:', {
        scheduledTime: scheduledTime.toISOString(),
        currentTime: now.toISOString()
      });

      // Create the trigger based on platform
      let trigger: NotificationTriggerInput;
      
      if (Platform.OS === 'ios') {
        // On iOS, use calendar-based trigger
        trigger = {
          type: SchedulableTriggerInputTypes.CALENDAR,
          repeats: true,
          hour: scheduledTime.getHours(),
          minute: scheduledTime.getMinutes(),
          second: 0
        };
      } else {
        // On Android, use daily trigger for repeating notifications
        const dailyTrigger: DailyTriggerInput = {
          type: SchedulableTriggerInputTypes.DAILY,
          hour: scheduledTime.getHours(),
          minute: scheduledTime.getMinutes()
        };
        trigger = dailyTrigger;
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: habit.name,
          body: habit.notification.message,
          data: {
            habitId: habit.id,
            type: 'habit_reminder',
            scheduledTime: scheduledTime.toISOString(),
          },
          categoryIdentifier: 'habit',
          sound: 'default',
          priority: 'high'
        },
        trigger,
      });

      // For Android and custom days, schedule additional notifications for other selected days
      if (Platform.OS === 'android' && habit.occurrence.type === 'custom') {
        const dayMap: { [key: string]: number } = {
          'SUNDAY': 0,
          'MONDAY': 1,
          'TUESDAY': 2,
          'WEDNESDAY': 3,
          'THURSDAY': 4,
          'FRIDAY': 5,
          'SATURDAY': 6
        };
        
        const selectedDays = habit.occurrence.days
          .map(day => dayMap[day])
          .filter(day => day !== scheduledTime.getDay()); // Exclude the day we just scheduled

        // Schedule notifications for each remaining selected day
        for (const weekday of selectedDays) {
          const weeklyTrigger: WeeklyTriggerInput = {
            type: SchedulableTriggerInputTypes.WEEKLY,
            weekday: weekday + 1, // Expo uses 1-7 for weekdays
            hour: scheduledTime.getHours(),
            minute: scheduledTime.getMinutes(),
          };

          await Notifications.scheduleNotificationAsync({
            content: {
              title: habit.name,
              body: habit.notification.message,
              data: {
                habitId: habit.id,
                type: 'habit_reminder',
                scheduledTime: scheduledTime.toISOString(),
              },
              categoryIdentifier: 'habit',
              sound: 'default',
              priority: 'high'
            },
            trigger: weeklyTrigger,
          });
        }
      }

      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return undefined;
    }
  }

  // Clean up method
  cleanup() {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
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