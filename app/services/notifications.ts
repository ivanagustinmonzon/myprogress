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
      const now = new Date();
      const scheduled = new Date(scheduledTime);
      const delayInSeconds = (now.getTime() - scheduled.getTime()) / 1000;

      console.log('🕒 Notification Delivery Debug:', {
        scheduledFor: scheduledTime,
        actualDelivery: now.toISOString(),
        delayInSeconds,
        habitId
      });

      // Schedule next notification
      const habit = await storage.getHabit(habitId);
      if (habit) {
        const nextScheduledTime = new Date(scheduledTime);
        nextScheduledTime.setDate(nextScheduledTime.getDate() + 1);
        
        // Adjust for any drift that occurred
        if (delayInSeconds > 5) { // If delay was significant
          console.log('⚠️ Adjusting for timing drift:', delayInSeconds, 'seconds');
          nextScheduledTime.setSeconds(nextScheduledTime.getSeconds() - Math.floor(delayInSeconds));
        }
        
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
      
      // Set notification time for today with precise timing
      const scheduledTime = new Date(now);
      scheduledTime.setHours(notificationTime.getHours());
      scheduledTime.setMinutes(notificationTime.getMinutes());
      scheduledTime.setSeconds(0);
      scheduledTime.setMilliseconds(0);

      // Debug logs for timing
      const msUntilNotification = scheduledTime.getTime() - now.getTime();
      console.log('🕒 Notification Schedule Debug:', {
        currentTimeUTC: now.toISOString(),
        targetTimeUTC: scheduledTime.toISOString(),
        msUntilNotification,
        secondsUntilNotification: Math.floor(msUntilNotification / 1000),
        platform: Platform.OS,
        habitId: habit.id,
        habitName: habit.name
      });

      // If the time has passed for today, schedule for tomorrow
      if (scheduledTime.getTime() <= now.getTime()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
        console.log('📅 Scheduling for tomorrow:', scheduledTime.toISOString());
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

        console.log('📆 Custom Schedule:', {
          selectedDays: habit.occurrence.days,
          daysToAdd,
          nextOccurrence: scheduledTime.toISOString()
        });
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
        console.log('🍎 iOS Trigger:', trigger);
      } else {
        // On Android, use precise time interval
        const msUntilTrigger = scheduledTime.getTime() - now.getTime();
        const secondsUntilTrigger = Math.max(1, Math.ceil(msUntilTrigger / 1000));
        
        trigger = {
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilTrigger,
          repeats: false
        };
        console.log('🤖 Android Trigger:', {
          ...trigger,
          expectedTriggerTime: new Date(now.getTime() + secondsUntilTrigger * 1000).toISOString()
        });
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: habit.name,
          body: habit.notification.message,
          data: {
            habitId: habit.id,
            type: 'habit_reminder',
            scheduledTime: scheduledTime.toISOString(),
            targetTime: scheduledTime.toISOString() // Store the target time separately
          },
          categoryIdentifier: 'habit',
          sound: 'default',
          priority: 'high'
        },
        trigger,
      });

      // For Android and custom days, schedule additional notifications
      if (Platform.OS === 'android') {
        // Schedule the next notification immediately after this one
        const nextScheduledTime = new Date(scheduledTime);
        nextScheduledTime.setDate(nextScheduledTime.getDate() + 1);
        
        // Schedule it with a slight delay to avoid conflicts
        setTimeout(() => {
          this.scheduleHabitNotification({
            ...habit,
            notification: {
              ...habit.notification,
              time: nextScheduledTime.toISOString()
            }
          });
        }, 1000);
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