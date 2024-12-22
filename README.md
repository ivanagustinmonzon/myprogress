# MyProgress App

A habit tracking application built with React Native

## Getting Started

1. **Prerequisites**
- Node.js (v22.11.0)
- Expo (npx expo) 0.22.6

2. **Development Setup**
```bash
# Installation
npm install

# Development
npm run start       # Start dev server
npm run ios         
npm run android     

# Testing
npm run test         # Run all tests
```


## Architecture Overview

### Core Principles

1. **Hexagonal Architecture**
- Ports and Adapters pattern for flexibility
   - Port: Interface for external services (in, out)
   - Adapter: Implementation of the port
- Domain Driven Design

2. **Event-Driven Components**
- Events used for non-critical side effects.
- Direct calls for core functionality

3. **CQRS**
- Commands modify state and return void/success/failure
   - `UI -> Command -> Use Case -> Domain -> Save -> (Optional) Emit Events`
- Queries return data but don't modify state
   - `UI -> Query -> Use Case -> Repository -> Return Data`

### Project Structure

```
src/
├── domain/                         # Business Invariants
│   ├── habit/                      
│   │   ├── aggregate.ts            # Aggregate Root
│   │   ├── entities/
│   │   │   ├── Streak.ts
│   │   │   └── Completion.ts
│   │   ├── value-objects/
│   │   │   ├── HabitFrequency.ts
│   │   │   ├── HabitPeriod.ts
│   │   │   └── CompletionStatus.ts
│   │   ├── types.ts
│   │   └── events.ts               # Domain Events
│   └── shared/                     # Shared Domain Concepts
│       ├── UserId.ts
│       └── DateRange.ts
│
├── application/                   
│   ├── ports/                     
│   │   ├── in/                    # Driving Ports
│   │   │   ├── HabitCommands.ts   # Write operations (Pub)
│   │   │   └── HabitQueries.ts    # Read operations
│   │   └── out/                   # Driven Ports
│   │       ├── HabitRepository.ts
│   │       └── EventBus.ts
│   │
│   ├── eventHandlers/             # Side Effects (Sub)
│   │   ├── AnalyticsHandler.ts
│   │   ├── NotificationHandler.ts
│   │   └── StreakHandler.ts
│   │
│   └── use-cases/                 # Driving adapter 
│       ├── CreateHabit.ts        
│       ├── CompleteHabit.ts
│       └── GetHabitStats.ts
│
├── adapters/                      # Implementation
│   └── secondary/                 # Driven Adapters
│       ├── persistence/
│       │   ├── SQLHabitRepository.ts
│       │   └── mappers/
│       │       └── HabitMapper.ts
│       │
│       └── events/
│           └── InMemoryEventBus.ts
│           └── RabbitMQEventBus.ts
│
├── app/                           # Driving adapter
│   └── App.tsx                    # Entry point, wiring
│   └── (tabs)/                    # UI (Expo Route convention) 
│       ├── habits.tsx             # Habits Screen
│       └── stats.tsx              # Stats Screen
│
└── config/                        # App Config
```


### Key Concepts

1. **Core Operations (Direct Calls)**
```typescript
// Direct synchronous operations for critical path
class CreateHabitUseCase {
   async execute(data: CreateHabitDTO): Promise<Habit> {
      const habit = new Habit(data);
      await this.habitRepo.save(habit);
      await this.reminderService.scheduleReminders(habit);
      return habit;
   }
}
```

2. **Side Effects (Event-Driven)**
```typescript
// Asynchronous operations for non-critical features
class CompleteHabitUseCase {
   async execute(habitId: string): Promise<void> {
      const habit = await this.habitRepo.findById(habitId);
      habit.complete();
      await this.habitRepo.save(habit);
      
      // Side effects via events
      await this.eventBus.publish(new HabitCompletedEvent(habit));
   }
}
```

3. **Dependency Injection**
```typescript
// 1. Port (interface) that UI depends on
interface CompleteHabitPort {
  execute(cmd: CompleteHabitCommand): Promise<void>
}

// 2. Use case implements the port
class CompleteHabitUseCase implements CompleteHabitPort {
  constructor(
    private repository: HabitRepositoryPort,
    private eventBus: EventBusPort
  ) {}

  execute(cmd) {
    // ... implementation
  }
}

// 3. UI/React component depends on PORT, not implementation
function HabitScreen({ completeHabitPort }: { completeHabitPort: CompleteHabitPort }) {
  const onComplete = async () => {
    await completeHabitPort.execute({ id: '1', date: new Date() })
  }
}

// 4. Composition root (e.g. main.tsx, App.tsx) wires everything
const repository = new SQLHabitRepository()
const eventBus = new RabbitMQEventBus()
const completeHabitUseCase = new CompleteHabitUseCase(repository, eventBus)

<HabitScreen completeHabitPort={completeHabitUseCase} />
```

### Development Guidelines

1. **When to Use Direct Calls**
- Core habit operations (CRUD)
- User-facing immediate feedback required
- Operations requiring strong consistency
- Critical path functionality

2. **When to Use Events**
- Statistics updates
- Achievement checking
- Social feed updates
- Notifications
- Analytics tracking

3. **Testing Strategy**
```
Domain Tests → Use Case Tests → Adapter Tests → E2E Tests
```
- Domain: Pure unit tests
- Use Cases: Integration tests with mocked ports
- Adapters: Integration tests with real implementations
- E2E: Full user flow tests



### Best Practices

1. **Domain Logic**
- Keep domain logic in domain layer
- Use value objects for validation
- Raise domain events for significant changes

2. **Use Cases**
- One primary operation per use case
- Handle orchestration of domain objects
- Manage transactions when needed
- Publish events for side effects

3. **Event Handling**
- Keep event handlers focused
- Handle failures gracefully
- Log events for debugging
- Don't depend on event order

4. **Adapters**
- Implement one port per adapter
- Keep adapters thin
- Handle external service errors
- Convert between domain and external models

### Common Pitfalls to Avoid

1. **Architecture**
- Don't bypass ports for direct access
- Avoid business logic in adapters
- Don't make domain depend on external concerns

2. **Event Usage**
- Don't use events for core operations
- Avoid critical path dependencies on events
- Don't overuse events for simple operations

3. **Testing**
- Don't test adapters through domain
- Avoid testing implementation details
- Don't skip integration tests

#### why
This architecture supports maintainable code through:
- Clear boundaries between concerns
- Predictable data flow
- Testable components
- Scalable event patterns for side effects
