
import { GetActiveHabitsQuery, ListActiveHabitsPort } from "@/src/application/habit/ports/in/queries/ListHabits";
import { HabitRepository } from "@/src/application/habit/ports/out/Repository";
import { HabitAggregate } from "@/src/domain/habit/aggregate";

export class FetchActiveHabitsUseCase implements ListActiveHabitsPort {
  constructor(private readonly habitRepository: HabitRepository) { }

  async execute(query: GetActiveHabitsQuery): Promise<HabitAggregate[]> {
    return this.habitRepository.findActive();
  }
}