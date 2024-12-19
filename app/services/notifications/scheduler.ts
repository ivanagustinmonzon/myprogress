import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationScheduleOptions } from './types';
import { 
  calculateNextScheduleTime, 
  findNextCustomOccurrence, 
  createNotificationContent,
  shouldShowNotification
} from './utils';
import { clock } from '../clock';
import { createValidTime } from '../../types/habit';
import { SchedulableTriggerInputTypes, CalendarTriggerInput, TimeIntervalTriggerInput } from 'expo-notifications';

export const scheduleHabitNotification = async (
  options: NotificationScheduleOptions
): Promise<string | undefined> => {
  if (Platform.OS === 'web') return;

  try {
    const { habit, currentTime = clock.now() } = options;

    if (!habit) {
      throw new Error('Habit is required for scheduling notifications');
    }

    if (!habit.notification || !habit.notification.time) {
      throw new Error('Habit notification time is required');
    }

    // Only cancel existing notification if we have an identifier
    if (habit.notification.identifier) {
      try {
        await Notifications.cancelScheduledNotificationAsync(habit.notification.identifier);
      } catch (error) {
        console.log('Error canceling existing notification:', error);
        // Continue with scheduling even if cancellation fails
      }
    }

    const notificationTime = new Date(habit.notification.time);
    const validNotificationTime = createValidTime(notificationTime);
    if (!validNotificationTime.isValid || !validNotificationTime.value) {
      console.error('Invalid notification time:', validNotificationTime.error);
      return undefined;
    }
    
    // Calculate initial schedule time
    let scheduledTime = calculateNextScheduleTime(validNotificationTime.value, currentTime);
    const validScheduledTime = createValidTime(scheduledTime);
    if (!validScheduledTime.isValid || !validScheduledTime.value) {
      console.error('Invalid scheduled time:', validScheduledTime.error);
      return undefined;
    }

    // Handle custom occurrence days
    if (habit.occurrence.type === 'custom') {
      scheduledTime = findNextCustomOccurrence(validScheduledTime.value, habit.occurrence.days);
      const validCustomTime = createValidTime(scheduledTime);
      if (!validCustomTime.isValid || !validCustomTime.value) {
        console.error('Invalid custom scheduled time:', validCustomTime.error);
        return undefined;
      }
      scheduledTime = validCustomTime.value;
    } else {
      scheduledTime = validScheduledTime.value;
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

    // Create notification content
    const content = createNotificationContent(habit, scheduledTime);

    // Create platform-specific trigger
    const trigger = Platform.OS === 'ios' 
      ? {
          type: SchedulableTriggerInputTypes.CALENDAR,
          hour: scheduledTime.getHours(),
          minute: scheduledTime.getMinutes(),
          second: 0,
          repeats: true
        } as CalendarTriggerInput
      : {
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, Math.ceil(msUntilNotification / 1000)),
          repeats: false
        } as TimeIntervalTriggerInput;

    // Schedule the notification
    const identifier = await Notifications.scheduleNotificationAsync({
      content,
      trigger,
    });

    // For Android, schedule the next day's notification immediately
    if (Platform.OS === 'android') {
      const nextScheduledTime = new Date(scheduledTime);
      nextScheduledTime.setDate(nextScheduledTime.getDate() + 1);
      const validNextTime = createValidTime(nextScheduledTime);
      if (!validNextTime.isValid || !validNextTime.value) {
        console.error('Invalid next day scheduled time:', validNextTime.error);
        return identifier;
      }
      
      // For custom occurrence, validate the next day
      if (habit.occurrence.type === 'custom') {
        const isValidDay = await shouldShowNotification({
          ...habit,
          notification: {
            ...habit.notification,
            time: validNextTime.value.toISOString()
          }
        });
        
        if (!isValidDay) {
          console.log('Skipping next day scheduling - not a valid occurrence day');
          return identifier;
        }
      }

      // Schedule next day's notification
      await Notifications.scheduleNotificationAsync({
        content: createNotificationContent(habit, validNextTime.value),
        trigger: {
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, Math.ceil((validNextTime.value.getTime() - currentTime.getTime()) / 1000)),
          repeats: false
        } as TimeIntervalTriggerInput
      });
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