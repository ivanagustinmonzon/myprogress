import { ISODateString } from "@/src/domain/habit/types";

export interface Clock {
  now(): Date;
  toISOString(): ISODateString;
  getDay(): number;
  getMonth(): number;
}