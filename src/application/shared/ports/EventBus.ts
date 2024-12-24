import { DomainEvent } from "@/src/domain/habit/events";

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: T["type"],
    handler: (event: T) => Promise<void>,
  ): void;
}
