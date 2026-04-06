import type { ITaskRepository } from '../repositories/ITaskRepository';
import type { ITask } from '../models/ITask';

export class GetTasksUseCase {
  constructor(private readonly repository: ITaskRepository) {}

  async execute(): Promise<ITask[]> {
    return this.repository.getTasks();
  }
}
