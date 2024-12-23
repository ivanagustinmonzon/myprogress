import { HabitType } from "@/src/types/habit";
import {
  NotificationConfig,
  HabitOccurrence,
} from "@/src/domain/habit/aggregate";

export interface CreateHabitCommand {
  name: string;
  type: HabitType;
  occurrence: HabitOccurrence;
  notification: NotificationConfig;
  motivation?: string;
}

export const createBuildHabitCommand = (
  name: string,
  occurrence: HabitOccurrence,
  notification: NotificationConfig,
  motivation?: string
): CreateHabitCommand => ({
  type: "build",
  name,
  occurrence,
  notification,
  motivation,
});

export const createBreakHabitCommand = (
  name: string,
  occurrence: HabitOccurrence,
  notification: NotificationConfig,
  motivation?: string
): CreateHabitCommand => ({
  type: "break",
  name,
  occurrence,
  notification,
  motivation,
});

export interface CreateHabitPort {
  execute(command: CreateHabitCommand): Promise<void>;
}
