import type { ITaskRepository } from '../repositories/ITaskRepository';

export class SyncTasksUseCase {
  constructor(private readonly repository: ITaskRepository) {}

  /** Pull remote → upsert local. Returns count of synced records. */
  async execute(): Promise<number> {
    return this.repository.syncRemote();
  }

  /** Push pending local mutations to remote. */
  async pushPending(): Promise<void> {
    return this.repository.pushPending();
  }
}
