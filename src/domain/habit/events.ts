import { Days, HabitType, ISODateString } from "@/src/domain/habit/types";
import { HabitAggregate } from "./aggregate";

export interface HabitEvent {
  habitId: string;
  occurredAt: ISODateString;
}

export interface HabitCreatedEvent extends HabitEvent {
  type: "HABIT_CREATED";
  name: string;
  habitType: HabitType;
  occurrence: {
    type: "daily" | "custom";
    days: Days[];
  };
}

export const makeHabitCreatedEvent = (habit: HabitAggregate): HabitCreatedEvent => {
  return {
    habitId: habit.id,
    occurredAt: habit.createdAt,
    type: "HABIT_CREATED",
    name: habit.name,
    habitType: habit.type,
    occurrence: habit.occurrence,
  };
}

export interface HabitCompletedEvent extends HabitEvent {
  type: "HABIT_COMPLETED";
  completedAt: ISODateString;
}

export interface HabitDeactivatedEvent extends HabitEvent {
  type: "HABIT_DEACTIVATED";
  reason?: string;
}

export interface HabitUpdatedEvent extends HabitEvent {
  type: "HABIT_UPDATED";
  changes: {
    name?: string;
    occurrence?: {
      type: "daily" | "custom";
      days: Days[];
    };
    notification?: {
      message: string;
      time: string;
    };
  };
}

export type DomainEvent =
  | HabitCreatedEvent
  | HabitCompletedEvent
  | HabitDeactivatedEvent
  | HabitUpdatedEvent;
  