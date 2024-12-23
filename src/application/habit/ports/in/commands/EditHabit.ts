import { HabitType } from "@/src/types/habit";
import {
  NotificationConfig,
  HabitOccurrence,
} from "@/src/domain/habit/aggregate";

export interface EditHabitCommand {
  id: string;
  name: string;
  type: HabitType;
  occurrence: HabitOccurrence;
  notification: NotificationConfig;
}

export interface EditHabitPort {
  execute(command: EditHabitCommand): Promise<void>;
}
