import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationScheduleOptions } from './types';
import { 
  calculateNextScheduleTime, 
  findNextCustomOccurrence, 
  createTriggerConfig,
  createNotificationContent
} from './utils';

export const scheduleHabitNotification = async (
  options: NotificationScheduleOptions
): Promise<string | undefined> => {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return;
  }

  try {
    const { habit, currentTime = new Date() } = options;

    if (!habit) {
      throw new Error('Habit is required for scheduling notifications');
    }

    if (!habit.notification || !habit.notification.time) {
      throw new Error('Habit notification time is required');
    }

    const notificationTime = new Date(habit.notification.time);
    
    // Calculate initial schedule time
    let scheduledTime = calculateNextScheduleTime(notificationTime, currentTime);

    // Handle custom occurrence days
    if (habit.occurrence.type === 'custom') {
      scheduledTime = findNextCustomOccurrence(scheduledTime, habit.occurrence.days);
    }

    // Debug logs
    const msUntilNotification = scheduledTime.getTime() - currentTime.getTime();
    console.log('🕒 Notification Schedule Debug:', {
      currentTimeUTC: currentTime.toISOString(),
      targetTimeUTC: scheduledTime.toISOString(),
      msUntilNotification,
      secondsUntilNotification: Math.floor(msUntilNotification / 1000),
      platform: Platform.OS,
      habitId: habit.id,
      habitName: habit.name
    });

    // Create trigger configuration
    const { trigger } = createTriggerConfig(scheduledTime, currentTime);

    // Schedule the notification
    const identifier = await Notifications.scheduleNotificationAsync({
      content: createNotificationContent(habit, scheduledTime),
      trigger,
    });

    // For Android, schedule the next notification
    if (Platform.OS === 'android') {
      const nextScheduledTime = new Date(scheduledTime);
      nextScheduledTime.setDate(nextScheduledTime.getDate() + 1);
      
      // Schedule with slight delay to avoid conflicts
      setTimeout(() => {
        scheduleHabitNotification({
          habit: {
            ...habit,
            notification: {
              ...habit.notification,
              time: nextScheduledTime.toISOString()
            }
          }
        });
      }, 1000);
    }

    return identifier;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return undefined;
  }
};

export const cancelHabitNotification = async (identifier: string): Promise<void> => {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};

export const cancelAllHabitNotifications = async (): Promise<void> => {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
};

export const getScheduledNotifications = async () => {
  if (Platform.OS === 'web') return [];

  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}; 