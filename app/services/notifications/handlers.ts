import * as Notifications from 'expo-notifications';
import storage from '../storage';
import { scheduleHabitNotification } from './scheduler';

export const handleNotificationReceived = async (notification: Notifications.Notification) => {
  const habitId = notification.request.content.data?.habitId;
  const scheduledTime = notification.request.content.data?.scheduledTime;
  
  if (!habitId || !scheduledTime) return;

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

    await Notifications.dismissNotificationAsync(response.notification.request.identifier);
  } catch (error) {
    console.error('Error handling notification action:', error);
  }
}; 