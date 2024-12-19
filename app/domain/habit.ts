import { StoredHabit, HabitProgress, HabitId, createHabitId, isValidHabitId } from '../types/storage';
import { 
  Days, 
  HabitType, 
  HabitOccurrence,
  CustomOccurrence,
  NotificationConfig,
  ISODateString,
  isISODateString,
  isValidDay,
  isValidHabitType,
  isValidOccurrence,
  isValidNotificationConfig,
  createISODateString,
  parseISODateString,
  ValidTime,
  TimeValidationResult,
  createValidTime,
  formatTime,
  TimeFormatOptions,
  DAY_MAP
} from '../types/habit';

// Re-export types and functions needed by other modules
export type { ValidTime, TimeValidationResult };
export { createValidTime };

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class TimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeError';
  }
}

// Pure function to validate habit data with detailed error messages
export const validateHabit = (habit: StoredHabit): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!isValidHabitId(habit.id)) {
    errors.push('Invalid habit ID format');
  }

  if (!habit.name.trim()) {
    errors.push('Name is required');
  }

  if (!isValidHabitType(habit.type)) {
    errors.push('Invalid habit type');
  }

  if (!isValidOccurrence(habit.occurrence)) {
    errors.push('Invalid occurrence configuration');
  }

  if (!isValidNotificationConfig(habit.notification)) {
    errors.push('Invalid notification configuration');
  }

  if (!isISODateString(habit.createdAt)) {
    errors.push('Invalid created date format');
  }

  if (!isISODateString(habit.startDate)) {
    errors.push('Invalid start date format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Pure function to check if habit needs notification update
export const needsNotificationUpdate = (
  oldHabit: StoredHabit,
  newHabit: StoredHabit
): boolean => {
  return (
    newHabit.notification.time !== oldHabit.notification.time ||
    newHabit.notification.message.trim() !== oldHabit.notification.message.trim() ||
    newHabit.name.trim() !== oldHabit.name.trim()
  );
};

// Pure function to calculate next schedule time with error handling
export const calculateNextScheduleTime = (
  notificationTime: Date,
  currentTime: Date
): TimeValidationResult<ISODateString> => {
  const validNotificationTime = createValidTime(notificationTime);
  if (!validNotificationTime.isValid) {
    return { isValid: false, error: `Invalid notification time: ${validNotificationTime.error}` };
  }

  const validCurrentTime = createValidTime(currentTime);
  if (!validCurrentTime.isValid) {
    return { isValid: false, error: `Invalid current time: ${validCurrentTime.error}` };
  }

  const scheduledTime = new Date(validCurrentTime.value!);
  scheduledTime.setHours(validNotificationTime.value!.getHours());
  scheduledTime.setMinutes(validNotificationTime.value!.getMinutes());
  scheduledTime.setSeconds(0);
  scheduledTime.setMilliseconds(0);

  if (scheduledTime.getTime() <= validCurrentTime.value!.getTime()) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  try {
    return { 
      isValid: true, 
      value: createISODateString(scheduledTime)
    };
  } catch (error) {
    return { 
      isValid: false, 
      error: 'Failed to create ISO date string'
    };
  }
};

// Pure function to find next occurrence for custom schedules
export const findNextCustomOccurrence = (
  scheduledTime: Date,
  selectedDays: Days[],
  currentDay: number
): Date => {
  if (!(scheduledTime instanceof Date) || isNaN(scheduledTime.getTime())) {
    throw new TimeError('Invalid scheduled time');
  }

  if (!Array.isArray(selectedDays) || selectedDays.length === 0) {
    throw new ValidationError('Selected days must be a non-empty array');
  }

  if (typeof currentDay !== 'number' || currentDay < 0 || currentDay > 6) {
    throw new ValidationError('Current day must be a number between 0 and 6');
  }

  const selectedDayNumbers = selectedDays.map(day => DAY_MAP[day]);
  
  for (let i = 0; i < 7; i++) {
    const checkDay = (currentDay + i) % 7;
    if (selectedDayNumbers.includes(checkDay)) {
      const result = new Date(scheduledTime);
      result.setDate(result.getDate() + i);
      return result;
    }
  }
  
  throw new ValidationError('No valid days selected for notification');
};

// Pure function to calculate notification delay
export const calculateNotificationDelay = (
  scheduledTime: Date,
  actualTime: Date
): number => {
  if (!(scheduledTime instanceof Date) || isNaN(scheduledTime.getTime())) {
    throw new TimeError('Invalid scheduled time');
  }

  if (!(actualTime instanceof Date) || isNaN(actualTime.getTime())) {
    throw new TimeError('Invalid actual time');
  }

  return (actualTime.getTime() - scheduledTime.getTime()) / 1000;
};

// Pure function to filter habits by type
export const filterHabitsByType = (
  habits: StoredHabit[],
  type: 'build' | 'break'
): StoredHabit[] => {
  if (!Array.isArray(habits)) {
    throw new ValidationError('Habits must be an array');
  }

  return habits.filter(habit => habit.type === type && habit.isActive);
};

// Pure function to format time display
export const formatTimeDisplay = (date: Date, options: TimeFormatOptions = {}): TimeValidationResult<string> => {
  const validTime = createValidTime(date);
  if (!validTime.isValid) {
    return { isValid: false, error: validTime.error };
  }

  try {
    return {
      isValid: true,
      value: formatTime(validTime.value!, options)
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to format time'
    };
  }
};

// Pure function to calculate minutes until notification
export const calculateMinutesUntilNotification = (
  notificationTime: Date,
  currentTime: Date
): TimeValidationResult<number> => {
  const validNotificationTime = createValidTime(notificationTime);
  if (!validNotificationTime.isValid) {
    return { isValid: false, error: validNotificationTime.error };
  }

  const validCurrentTime = createValidTime(currentTime);
  if (!validCurrentTime.isValid) {
    return { isValid: false, error: validCurrentTime.error };
  }

  const msUntilNotification = validNotificationTime.value!.getTime() - validCurrentTime.value!.getTime();
  return {
    isValid: true,
    value: Math.floor(msUntilNotification / (1000 * 60))
  };
};

// Pure function to generate habit ID
export const generateHabitId = (): string => {
  return `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Pure function to create a new habit
export const createHabit = (
  name: string,
  type: HabitType,
  occurrence: HabitOccurrence,
  notification: Omit<NotificationConfig, 'identifier'>,
  currentTime: ISODateString
): StoredHabit => {
  const habit: StoredHabit = {
    id: createHabitId(Date.now(), Math.random().toString(36).substr(2, 9)),
    name: name.trim(),
    type,
    occurrence,
    notification: {
      message: notification.message.trim(),
      time: notification.time,
    },
    createdAt: currentTime,
    startDate: currentTime,
    isActive: true,
  };

  const validation = validateHabit(habit);
  if (!validation.isValid) {
    throw new ValidationError(validation.errors.join(', '));
  }

  return habit;
};

// Pure function to check for unsaved changes
export const hasUnsavedChanges = (
  originalHabit: StoredHabit,
  currentName: string,
  currentMessage: string,
  currentTime: Date,
  currentDays: Days[]
): boolean => {
  if (!originalHabit) return false;

  const currentDaysMatch = originalHabit.occurrence.type === 'custom' 
    ? JSON.stringify(currentDays) === JSON.stringify((originalHabit.occurrence as CustomOccurrence).days)
    : true;

  return (
    currentName.trim() !== originalHabit.name ||
    currentMessage.trim() !== originalHabit.notification.message ||
    currentTime.toISOString() !== originalHabit.notification.time ||
    !currentDaysMatch
  );
};

// Pure function to toggle a day in a list
export const toggleDay = (
  currentDays: Days[],
  dayToToggle: Days
): Days[] => {
  if (!Array.isArray(currentDays) || !currentDays.every(isValidDay)) {
    throw new ValidationError('Invalid days array');
  }

  if (!isValidDay(dayToToggle)) {
    throw new ValidationError('Invalid day to toggle');
  }

  const isSelected = currentDays.includes(dayToToggle);
  if (isSelected) {
    return currentDays.filter(day => day !== dayToToggle);
  }
  return [...currentDays, dayToToggle];
};

// Pure function to format schedule text
export const formatScheduleText = (
  occurrenceType: 'daily' | 'custom',
  days: Days[]
): string => {
  if (occurrenceType === 'daily') {
    return 'Every day';
  }
  return `${days.length} days per week`;
};

// Pure function to format days list
export const formatDaysList = (days: Days[]): string => {
  if (!Array.isArray(days)) {
    throw new ValidationError('Days must be an array');
  }

  return days
    .map(day => day.charAt(0) + day.slice(1).toLowerCase())
    .join(', ');
};

// Pure function to calculate next reminder text
export const getNextReminderText = (minutesUntil: number): string => {
  if (typeof minutesUntil !== 'number') {
    throw new ValidationError('Minutes until must be a number');
  }

  if (minutesUntil < 0) {
    return `Next reminder in ${24 * 60 + minutesUntil} minutes`;
  }
  return `Next reminder in ${minutesUntil} minutes`;
};

// Pure function to validate time string
export const validateTimeString = (timeString: string): boolean => {
  try {
    const date = new Date(timeString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};

// Pure function to parse and validate params
export const validateAndParseParams = (params: {
  name?: string;
  occurrence?: string;
  days?: string;
  notification?: string;
  time?: string;
}): { isValid: boolean; errors: string[]; parsedDays?: Days[] } => {
  const errors: string[] = [];

  if (!params.name) errors.push('Name is required');
  if (!params.occurrence) errors.push('Occurrence is required');
  if (!params.notification) errors.push('Notification is required');
  if (!params.time) errors.push('Time is required');

  let parsedDays: Days[] | undefined;
  if (params.days) {
    try {
      parsedDays = JSON.parse(params.days);
      if (!Array.isArray(parsedDays)) {
        errors.push('Days must be an array');
      }
    } catch {
      errors.push('Invalid days format');
    }
  } else {
    errors.push('Days are required');
  }

  if (params.time && !validateTimeString(params.time)) {
    errors.push('Invalid time format');
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsedDays
  };
};

// Pure function to format notification time
export const formatNotificationTime = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new TimeError('Invalid date for notification time');
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};
  