import type { ITaskRepository } from '../repositories/ITaskRepository';
import type { ITask, UpdateTaskInput } from '../models/ITask';

export class UpdateTaskUseCase {
  constructor(private readonly repository: ITaskRepository) {}

  async execute(id: string, input: UpdateTaskInput): Promise<ITask> {
    if (input.title !== undefined && !input.title.trim()) {
      throw new Error('Task title cannot be empty.');
    }
    return this.repository.updateTask(id, input);
  }
}
