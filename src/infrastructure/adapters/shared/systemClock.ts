import { Clock } from "@/src/application/shared/ports/Clock";
import { ISODateString } from "@/src/domain/habit/types";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }

  toISOString(): ISODateString {
    return this.now().toISOString() as ISODateString;
  }

  getDay(): number {
    return this.now().getDay();
  }
  
  getMonth(): number {
    return this.now().getMonth();
  }
}

export const clock = new SystemClock();