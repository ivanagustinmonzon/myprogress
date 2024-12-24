import { DomainEvent } from "@/src/domain/habit/events";
import {
  Days,
  HabitType,
  ISODateString,
  isValidHabitType,
} from "@/src/domain/habit/types";

export interface NotificationConfig {
  message: string;
  time: string;
}

export interface HabitOccurrence {
  type: "daily" | "custom";
  days: Days[];
}

export interface HabitProps {
  id: string;
  name: string;
  type: HabitType;
  occurrence: HabitOccurrence;
  notification: NotificationConfig;
  createdAt: ISODateString;
  startDate: ISODateString;
  isActive: boolean;
}

export class HabitAggregate {
  private props: HabitProps;
  private events: DomainEvent[] = [];

  private constructor(props: HabitProps) {
    this.validateProps(props);
    this.props = props;
  }

  public static create(
    props: Omit<HabitProps, "createdAt" | "startDate" | "isActive">,
    now: ISODateString
  ): HabitAggregate {
    const habit = new HabitAggregate({
      ...props,
      createdAt: now,
      startDate: now,
      isActive: true,
    });

    habit.addEvent({
      type: "HABIT_CREATED",
      habitId: props.id,
      occurredAt: now,
      name: props.name,
      habitType: props.type,
      occurrence: props.occurrence,
    });

    return habit;
  }

  edit(
    props: Partial<Omit<HabitProps, 'id' | 'createdAt'>>,
    now: ISODateString
  ): void {
    // Create new state by merging existing props with updates
    const updatedProps = {
      ...this.props,
      ...props
    };

    // Validate the complete state after changes
    this.validateProps(updatedProps);

    // Track what actually changed for the event
    const changes: Partial<HabitProps> = {};

    // Update individual properties and track changes
    if (props.name && props.name !== this.props.name) {
      this.props.name = props.name;
      changes.name = props.name;
    }

    if (props.type && props.type !== this.props.type) {
      this.props.type = props.type;
      changes.type = props.type;
    }

    if (props.occurrence && JSON.stringify(props.occurrence) !== JSON.stringify(this.props.occurrence)) {
      this.props.occurrence = props.occurrence;
      changes.occurrence = props.occurrence;
    }

    if (props.notification && JSON.stringify(props.notification) !== JSON.stringify(this.props.notification)) {
      this.props.notification = props.notification;
      changes.notification = props.notification;
    }

    if (props.startDate && props.startDate !== this.props.startDate) {
      this.props.startDate = props.startDate;
      changes.startDate = props.startDate;
    }

    // Only emit event if there were actual changes
    if (Object.keys(changes).length > 0) {
      this.addEvent({
        type: "HABIT_UPDATED",
        habitId: this.props.id,
        occurredAt: now,
        changes
      });
    }
  }

  delete(now: ISODateString): void {
    this.props.isActive = false;
    this.addEvent({
      type: "HABIT_DEACTIVATED",
      habitId: this.props.id,
      occurredAt: now,
      reason: "Deleted",
    });
  }

  private validateProps(props: HabitProps): void {
    if (!props.name.trim()) {
      throw new Error("Habit name is required");
    }

    if (!isValidHabitType(props.type)) {
      throw new Error("Invalid habit type");
    }

    if (
      props.occurrence.type === "custom" &&
      props.occurrence.days.length === 0
    ) {
      throw new Error("Custom occurrence requires at least one day");
    }

    if (!props.notification.message.trim()) {
      throw new Error("Notification message is required");
    }

    try {
      new Date(props.notification.time);
    } catch {
      throw new Error("Invalid notification time");
    }
  }

  private addEvent(event: DomainEvent): void {
    this.events.push(event);
  }

  // Domain methods
  complete(completedAt: ISODateString): void {
    if (!this.props.isActive) {
      throw new Error("Cannot complete inactive habit");
    }

    this.addEvent({
      type: "HABIT_COMPLETED",
      habitId: this.props.id,
      occurredAt: new Date().toISOString() as ISODateString,
      completedAt,
    });
  }

  deactivate(reason?: string): void {
    if (!this.props.isActive) {
      return; // Already inactive
    }

    this.props.isActive = false;
    this.addEvent({
      type: "HABIT_DEACTIVATED",
      habitId: this.props.id,
      occurredAt: new Date().toISOString() as ISODateString,
      reason,
    });
  }

  updateName(name: string): void {
    if (!name.trim()) {
      throw new Error("Habit name is required");
    }
    if (name.trim() === this.props.name) {
      return; // No change
    }

    this.props.name = name.trim();
    this.addEvent({
      type: "HABIT_UPDATED",
      habitId: this.props.id,
      occurredAt: new Date().toISOString() as ISODateString,
      changes: { name: name.trim() },
    });
  }

  updateOccurrence(occurrence: HabitOccurrence): void {
    if (occurrence.type === "custom" && occurrence.days.length === 0) {
      throw new Error("Custom occurrence requires at least one day");
    }

    this.props.occurrence = occurrence;
    this.addEvent({
      type: "HABIT_UPDATED",
      habitId: this.props.id,
      occurredAt: new Date().toISOString() as ISODateString,
      changes: { occurrence },
    });
  }

  updateNotification(notification: NotificationConfig): void {
    if (!notification.message.trim()) {
      throw new Error("Notification message is required");
    }
    try {
      new Date(notification.time);
    } catch {
      throw new Error("Invalid notification time");
    }

    this.props.notification = notification;
    this.addEvent({
      type: "HABIT_UPDATED",
      habitId: this.props.id,
      occurredAt: new Date().toISOString() as ISODateString,
      changes: { notification },
    });
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get type(): HabitType {
    return this.props.type;
  }

  get occurrence(): HabitOccurrence {
    return { ...this.props.occurrence };
  }

  get notification(): NotificationConfig {
    return { ...this.props.notification };
  }

  get createdAt(): ISODateString {
    return this.props.createdAt;
  }

  get startDate(): ISODateString {
    return this.props.startDate;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get getUncommittedEvents(): DomainEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }

  toJSON(): HabitProps {
    return { ...this.props };
  }
}
