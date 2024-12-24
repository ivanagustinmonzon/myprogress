import {
  HabitAggregate,
} from "@/src/domain/habit/aggregate";

// Simple query without user context for now
export interface GetActiveHabitsQuery {
  // Can add filter parameters here later if needed
  // e.g., status?: 'active' | 'archived'
}

export interface ListActiveHabitsPort {
  execute(query: GetActiveHabitsQuery): Promise<HabitAggregate[]>;
}