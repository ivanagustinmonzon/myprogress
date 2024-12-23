import { IdGenerator } from "@/src/application/shared/ports/IdGenerator";

export class UuidGenerator implements IdGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}
