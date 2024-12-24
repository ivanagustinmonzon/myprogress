import { NotificationTriggerInput } from "expo-notifications";

import { StoredHabit } from "../../types/storage";

export type DayMap = {
  [key: string]: number;
};

export const DAY_MAP: DayMap = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export interface NotificationConfig {
  shouldShowAlert: boolean;
  shouldPlaySound: boolean;
  shouldSetBadge: boolean;
}

export interface NotificationScheduleOptions {
  habit: StoredHabit;
  currentTime?: Date;
}

export interface NotificationTriggerConfig {
  trigger: NotificationTriggerInput;
  scheduledTime: Date;
}
