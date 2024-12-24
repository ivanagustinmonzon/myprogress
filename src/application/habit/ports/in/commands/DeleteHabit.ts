
export interface DeleteHabitCommand {
  id: string;
}

export interface DeleteHabitPort {
  execute(command: DeleteHabitCommand): Promise<void>;
}
