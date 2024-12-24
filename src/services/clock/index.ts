export interface Clock {
  now(): Date;
  toISOString(): string;
  getDay(): number;
  getMonth(): number;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }

  toISOString(): string {
    return this.now().toISOString();
  }

  getDay(): number {
    return this.now().getDay();
  }

  getMonth(): number {
    return this.now().getMonth();
  }
}

// For testing purposes
export class MockClock implements Clock {
  private currentDate: Date;

  constructor(initialDate?: Date) {
    this.currentDate = initialDate || new Date();
  }

  now(): Date {
    return this.currentDate;
  }

  toISOString(): string {
    return this.currentDate.toISOString();
  }

  getDay(): number {
    return this.currentDate.getDay();
  }

  getMonth(): number {
    return this.currentDate.getMonth();
  }

  // Helper method for testing
  setCurrentDate(date: Date) {
    this.currentDate = date;
  }
}

// Global clock instance
export const clock = new SystemClock();
