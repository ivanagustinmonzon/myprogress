import * as Notifications from 'expo-notifications';
import storage from '../storage';
import { scheduleHabitNotification } from './scheduler';
import { clock } from '../clock';
import { HabitProgress } from '../../types/storage';
export const handleNotificationReceived = async (notification: Notifications.Notification) => {
  // Potential Issues:
  // 1. No error handling for invalid dates
  // 2. Could create timing drift over time
  // 3. No limit on adjustment size
  const habitId = notification.request.content.data?.habitId;
  const scheduledTime = notification.request.content.data?.scheduledTime;
  
  if (!habitId || !scheduledTime) return;

  const now = clock.now();
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
  if (!habit) return;

  const nextScheduledTime = new Date(scheduledTime);
  nextScheduledTime.setDate(nextScheduledTime.getDate() + 1);
  
  // Adjust for any drift that occurred
  if (delayInSeconds > 5) {
    console.log('⚠️ Adjusting for timing drift:', delayInSeconds, 'seconds');
    nextScheduledTime.setSeconds(nextScheduledTime.getSeconds() - Math.floor(delayInSeconds));
  }
  
  await scheduleHabitNotification({
    habit: {
      ...habit,
      notification: {
        ...habit.notification,
        time: nextScheduledTime.toISOString()
      }
    }
  });
};

export const handleNotificationResponse = async (response: Notifications.NotificationResponse) => {
  const habitId = response.notification.request.content.data?.habitId;
  if (!habitId) return;

  const actionId = response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
    ? 'press'
    : response.actionIdentifier;

  const now = clock.toISOString();

  try {
    switch (actionId) {
      case 'complete':
        await storage.saveProgress({
          habitId,
          date: now,
          completed: true,
          skipped: false,
        } as HabitProgress);
        break;
      case 'skip':
        await storage.saveProgress({
          habitId,
          date: now,
          completed: false,
          skipped: true,
        } as HabitProgress);
        break;
      case 'press':
        console.log('Notification pressed for habit:', habitId);
        break;
    }

    await Notifications.dismissNotificationAsync(response.notification.request.identifier);
  } catch (error) {
    console.error('Error handling notification action:', error);
  }
}; 