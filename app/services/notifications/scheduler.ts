import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationScheduleOptions } from './types';
import { 
  calculateNextScheduleTime, 
  findNextCustomOccurrence, 
  createTriggerConfig,
  createNotificationContent,
  shouldShowNotification
} from './utils';
import { clock } from '../clock';

// Add global type declaration at the top
declare global {
  var __notificationTimeouts: { [key: string]: NodeJS.Timeout };
}

export const scheduleHabitNotification = async (
  options: NotificationScheduleOptions
): Promise<string | undefined> => {
  if (Platform.OS === 'web') return;

  try {
    // Clean up existing notifications first
    const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const existingForHabit = existingNotifications.filter(
      n => n.content.data?.habitId === options.habit.id
    );
    
    await Promise.all(
      existingForHabit.map(n => 
        Notifications.cancelScheduledNotificationAsync(n.identifier)
      )
    );

    const { habit, currentTime = clock.now() } = options;

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

    // For Android, use a more robust approach
    if (Platform.OS === 'android') {
      const nextScheduledTime = new Date(scheduledTime);
      nextScheduledTime.setDate(nextScheduledTime.getDate() + 1);
      
      // Validate next day for custom occurrence
      if (habit.occurrence.type === 'custom') {
        const isValidDay = await shouldShowNotification({
          ...habit,
          notification: {
            ...habit.notification,
            time: nextScheduledTime.toISOString()
          }
        });
        
        if (!isValidDay) {
          console.log('Skipping next day scheduling - not a valid occurrence day');
          return identifier;
        }
      }

      // Schedule with proper cleanup
      const timeoutId = setTimeout(() => {
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

      // Store timeout ID for cleanup
      global.__notificationTimeouts = global.__notificationTimeouts || {};
      global.__notificationTimeouts[habit.id] = timeoutId;
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