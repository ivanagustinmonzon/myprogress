export type HabitType = 'build' | 'break';

export enum Days {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export type DailyOccurrence = {
  days: [
    Days.MONDAY, 
    Days.TUESDAY, 
    Days.WEDNESDAY, 
    Days.THURSDAY, 
    Days.FRIDAY, 
    Days.SATURDAY, 
    Days.SUNDAY
  ]
}

export type CustomOccurrence = {
  days: Days[];
}

export type OccurrenceType = DailyOccurrence | CustomOccurrence;

export interface Habit {
  type: HabitType;
  occurrence: OccurrenceType;
  notification: string;
  startDate: string;
} 