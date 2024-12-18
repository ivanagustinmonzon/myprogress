import { Platform } from 'react-native';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { StoredHabit } from '../../types/storage';
import { DAY_MAP, NotificationTriggerConfig } from './types';

export const calculateNextScheduleTime = (
  notificationTime: Date,
  currentTime: Date = new Date()
): Date => {
  const scheduledTime = new Date(currentTime);
  scheduledTime.setHours(notificationTime.getHours());
  scheduledTime.setMinutes(notificationTime.getMinutes());
  scheduledTime.setSeconds(0);
  scheduledTime.setMilliseconds(0);

  if (scheduledTime.getTime() <= currentTime.getTime()) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  return scheduledTime;
};

export const findNextCustomOccurrence = (
  scheduledTime: Date,
  selectedDays: string[]
): Date => {
  const selectedDayNumbers = selectedDays.map(day => DAY_MAP[day]);
  const currentDay = scheduledTime.getDay();
  
  for (let i = 0; i < 7; i++) {
    const checkDay = (currentDay + i) % 7;
    if (selectedDayNumbers.includes(checkDay)) {
      const result = new Date(scheduledTime);
      result.setDate(result.getDate() + i);
      return result;
    }
  }
  
  throw new Error('No valid days selected for notification');
};

export const createTriggerConfig = (
  scheduledTime: Date,
  currentTime: Date = new Date()
): NotificationTriggerConfig => {
  if (Platform.OS === 'ios') {
    return {
      trigger: {
        type: SchedulableTriggerInputTypes.CALENDAR,
        repeats: true,
        hour: scheduledTime.getHours(),
        minute: scheduledTime.getMinutes(),
        second: 0
      },
      scheduledTime
    };
  }

  const msUntilTrigger = scheduledTime.getTime() - currentTime.getTime();
  const secondsUntilTrigger = Math.max(1, Math.ceil(msUntilTrigger / 1000));

  return {
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsUntilTrigger,
      repeats: false
    },
    scheduledTime
  };
};

export const createNotificationContent = (habit: StoredHabit, scheduledTime: Date) => ({
  title: habit.name,
  body: habit.notification.message,
  data: {
    habitId: habit.id,
    type: 'habit_reminder',
    scheduledTime: scheduledTime.toISOString(),
    targetTime: scheduledTime.toISOString()
  },
  categoryIdentifier: 'habit',
  sound: 'default',
  priority: 'high'
});

export const shouldShowNotification = async (habit: StoredHabit): Promise<boolean> => {
  if (habit.occurrence.type !== 'custom') {
    return true;
  }

  const selectedDays = habit.occurrence.days.map(day => DAY_MAP[day]);
  const currentDay = new Date().getDay();
  
  return selectedDays.includes(currentDay);
}; 