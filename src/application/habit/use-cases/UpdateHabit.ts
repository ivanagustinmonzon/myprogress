import {
  EditHabitCommand,
  EditHabitPort,
} from "@/src/application/habit/ports/in/commands/EditHabit";
import { HabitRepository } from "@/src/application/habit/ports/out/Repository";
import { Clock } from "@/src/application/shared/ports/Clock";
import { EventBus } from "@/src/application/shared/ports/EventBus";

export class EditHabitUseCase implements EditHabitPort {
  constructor(
    private readonly habitRepository: HabitRepository,
    private readonly eventBus: EventBus,
    private readonly clock: Clock
  ) { }

  async execute(command: EditHabitCommand): Promise<void> {
    const now = this.clock.toISOString();
    const habit = await this.habitRepository.findById(command.id);
    if (!habit) {
      throw new Error(`Habit with id ${command.id} not found`);
    }

    // Apply changes
    habit.edit({
      name: command.name,
      type: command.type,
      occurrence: command.occurrence,
      notification: command.notification,
    }, now);

    // Save the habit
    await this.habitRepository.save(habit);

    // Publish events
    const events = habit.getUncommittedEvents;
    await Promise.all(
      events.map((event) => this.eventBus.publish(event))
    );

    // Clear events after publishing
    habit.clearEvents();
  }
}
