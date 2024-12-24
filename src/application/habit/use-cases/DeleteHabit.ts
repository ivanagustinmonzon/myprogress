import { DeleteHabitCommand, DeleteHabitPort } from "@/src/application/habit/ports/in/commands/DeleteHabit";
import { HabitRepository } from "@/src/application/habit/ports/out/Repository";
import { Clock } from "@/src/application/shared/ports/Clock";
import { EventBus } from "@/src/application/shared/ports/EventBus";

export class DeleteHabitUseCase implements DeleteHabitPort {
  constructor(
    private readonly habitRepository: HabitRepository,
    private readonly clock: Clock,
    private readonly eventBus: EventBus
  ) { }

  async execute(command: DeleteHabitCommand): Promise<void> {
    const now = this.clock.toISOString();
    const habit = await this.habitRepository.findById(command.id);
    if (!habit) {
      throw new Error(`Habit with id ${command.id} not found`);
    }

    habit.deactivate(now);
    await this.habitRepository.save(habit);
    await Promise.all(
      habit.getUncommittedEvents.map(
        event => this.eventBus.publish(event))
    );
  }
}