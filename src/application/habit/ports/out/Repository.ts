import { HabitAggregate } from "@/src/domain/habit/aggregate";

export interface HabitRepository {
  save(habit: HabitAggregate): Promise<void>;
  findById(id: string): Promise<HabitAggregate | null>;
  findActive(): Promise<HabitAggregate[]>;
  findByType(type: "build" | "break"): Promise<HabitAggregate[]>;
  delete(id: string): Promise<void>;
}