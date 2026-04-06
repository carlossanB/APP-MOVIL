import type { ITaskRepository } from '../repositories/ITaskRepository';

export class DeleteTaskUseCase {
  constructor(private readonly repository: ITaskRepository) {}

  async execute(id: string): Promise<void> {
    return this.repository.deleteTask(id);
  }
}
