import type { ITaskRepository } from '../repositories/ITaskRepository';
import type { ITask, CreateTaskInput } from '../models/ITask';

export class CreateTaskUseCase {
  constructor(private readonly repository: ITaskRepository) {}

  async execute(input: CreateTaskInput): Promise<ITask> {
    if (!input.title.trim()) {
      throw new Error('Task title cannot be empty.');
    }
    return this.repository.createTask(input);
  }
}
