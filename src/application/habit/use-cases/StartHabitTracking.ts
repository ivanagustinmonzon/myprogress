import { HabitAggregate } from "@/src/domain/habit/aggregate";
import {
  CreateHabitCommand,
  CreateHabitPort,
} from "@/src/application/habit/ports/in/commands/CreateHabit";
import { HabitRepository } from "@/src/application/habit/ports/out/Repository";
import { EventBus } from "@/src/application/shared/ports/EventBus";
import { Clock } from "@/src/application/shared/ports/Clock";
import { IdGenerator } from "@/src/application/shared/ports/IdGenerator";

export class CreateHabitUseCase implements CreateHabitPort {
  constructor(
    private readonly habitRepository: HabitRepository,
    private readonly eventBus: EventBus,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock
  ) { }

  async execute(command: CreateHabitCommand): Promise<void> {
    const id = this.idGenerator.generate();
    const now = this.clock.toISOString();

    // Create the habit aggregate
    const habit = HabitAggregate.create({
      id,
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
