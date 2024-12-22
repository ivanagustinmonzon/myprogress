// Literal types for days
export const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
export type Days = typeof DAYS[number];

// Literal types for habit types
export const HABIT_TYPES = ['build', 'break'] as const;
export type HabitType = typeof HABIT_TYPES[number];

// Discriminated union for occurrence types
export type DailyOccurrence = {
  type: 'daily';
};

export type CustomOccurrence = {
  type: 'custom';
  days: Days[];
};

export type HabitOccurrence = DailyOccurrence | CustomOccurrence;

// Notification configuration
export type NotificationConfig = {
  message: string;
  time: string; // ISO string
  identifier?: string;
};

// Branded type for ISO date strings
declare const ISO_DATE_STRING: unique symbol;
export type ISODateString = string & { readonly [ISO_DATE_STRING]: never };

// Type guard for ISO date strings
export const isISODateString = (value: string): value is ISODateString => {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  return isoDateRegex.test(value);
};

// Type guard for Days
export const isValidDay = (value: string): value is Days => {
  return DAYS.includes(value as Days);
};

// Type guard for HabitType
export const isValidHabitType = (value: string): value is HabitType => {
  return HABIT_TYPES.includes(value as HabitType);
};

// Type guard for HabitOccurrence
export const isValidOccurrence = (value: any): value is HabitOccurrence => {
  if (value.type === 'daily') {
    return true;
  }
  if (value.type === 'custom') {
    return Array.isArray(value.days) && 
           value.days.every(isValidDay) &&
           value.days.length > 0;
  }
  return false;
};

// Type guard for NotificationConfig
export const isValidNotificationConfig = (value: any): value is NotificationConfig => {
  return typeof value === 'object' &&
         typeof value.message === 'string' &&
         value.message.trim().length > 0 &&
         typeof value.time === 'string' &&
         isISODateString(value.time) &&
         (value.identifier === undefined || typeof value.identifier === 'string');
};

// Day mapping with type safety
export const DAY_MAP: Record<Days, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 0,
} as const;

// Reverse day mapping
export const REVERSE_DAY_MAP: Record<number, Days> = Object.fromEntries(
  Object.entries(DAY_MAP).map(([key, value]) => [value, key as Days])
) as Record<number, Days>;

// Helper function to safely create ISO date string
export const createISODateString = (date: Date): ISODateString => {
  const isoString = date.toISOString();
  if (!isISODateString(isoString)) {
    throw new Error('Failed to create valid ISO date string');
  }
  return isoString;
};

// Helper function to safely parse ISO date string
export const parseISODateString = (isoString: ISODateString): Date => {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid ISO date string');
  }
  return date;
};

// Time-related branded types
declare const VALID_TIME: unique symbol;
export type ValidTime = Date & { readonly [VALID_TIME]: never };

// Time validation result type
export type TimeValidationResult<T> = {
  isValid: boolean;
  value?: T;
  error?: string;
};

// Type guard for valid time
export const isValidTime = (value: Date): value is ValidTime => {
  return value instanceof Date && !isNaN(value.getTime());
};

// Safe time creation
export const createValidTime = (value: Date | string | number): TimeValidationResult<ValidTime> => {
  try {
    const date = new Date(value);
    if (isValidTime(date)) {
      return { isValid: true, value: date as ValidTime };
    }
    return { isValid: false, error: 'Invalid time value' };
  } catch {
    return { isValid: false, error: 'Failed to parse time value' };
  }
};

// Time range type
export type TimeRange = {
  start: ValidTime;
  end: ValidTime;
};

// Safe time range creation
export const createTimeRange = (start: Date, end: Date): TimeValidationResult<TimeRange> => {
  const startResult = createValidTime(start);
  if (!startResult.isValid) {
    return { isValid: false, error: `Invalid start time: ${startResult.error}` };
  }

  const endResult = createValidTime(end);
  if (!endResult.isValid) {
    return { isValid: false, error: `Invalid end time: ${endResult.error}` };
  }

  if (startResult.value!.getTime() > endResult.value!.getTime()) {
    return { isValid: false, error: 'Start time must be before end time' };
  }

  return {
    isValid: true,
    value: {
      start: startResult.value!,
      end: endResult.value!
    }
  };
};

// Time format options type
export type TimeFormatOptions = {
  hour12?: boolean;
  includeSeconds?: boolean;
  includeMilliseconds?: boolean;
};

// Safe time formatting
export const formatTime = (time: ValidTime, options: TimeFormatOptions = {}): string => {
  const {
    hour12 = true,
    includeSeconds = false,
    includeMilliseconds = false
  } = options;

  let format: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12
  };

  if (includeSeconds) {
    format.second = '2-digit';
  }

  if (includeMilliseconds) {
    format.fractionalSecondDigits = 3;
  }

  return time.toLocaleTimeString([], format);
};
  