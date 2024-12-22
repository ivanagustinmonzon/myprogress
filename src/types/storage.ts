import {
  HabitType,
  HabitOccurrence,
  NotificationConfig,
  ISODateString,
} from "./habit";

// Branded type for habit IDs
declare const HABIT_ID: unique symbol;
export type HabitId = string & { readonly [HABIT_ID]: never };

// Type guard for habit IDs
export const isValidHabitId = (value: string): value is HabitId => {
  return /^habit-\d+-[a-z0-9]+$/.test(value);
};

export type StoredHabit = {
  readonly id: HabitId;
  name: string;
  type: HabitType;
  occurrence: HabitOccurrence;
  notification: NotificationConfig;
  createdAt: ISODateString;
  startDate: ISODateString;
  isActive: boolean;
};

export type HabitProgressStatus = {
  readonly completed: boolean;
  readonly skipped: boolean;
};

export type HabitProgress = {
  readonly habitId: HabitId;
  readonly date: ISODateString;
} & HabitProgressStatus;

// Type guard for StoredHabit
export const isValidStoredHabit = (value: any): value is StoredHabit => {
  return (
    typeof value === "object" &&
    isValidHabitId(value.id) &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    typeof value.type === "string" &&
    (value.type === "build" || value.type === "break") &&
    typeof value.occurrence === "object" &&
    (value.occurrence.type === "daily" ||
      (value.occurrence.type === "custom" &&
        Array.isArray(value.occurrence.days))) &&
    typeof value.notification === "object" &&
    typeof value.notification.message === "string" &&
    typeof value.notification.time === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.startDate === "string" &&
    typeof value.isActive === "boolean"
  );
};

// Type guard for HabitProgress
export const isValidHabitProgress = (value: any): value is HabitProgress => {
  return (
    typeof value === "object" &&
    isValidHabitId(value.habitId) &&
    typeof value.date === "string" &&
    typeof value.completed === "boolean" &&
    typeof value.skipped === "boolean"
  );
};

// Helper function to safely create a habit ID
export const createHabitId = (
  timestamp: number,
  randomPart: string,
): HabitId => {
  const id = `habit-${timestamp}-${randomPart}`;
  if (!isValidHabitId(id)) {
    throw new Error("Failed to create valid habit ID");
  }
  return id;
};

export interface StorageKeys {
  HABITS: "habits";
  PROGRESS: "progress";
}
