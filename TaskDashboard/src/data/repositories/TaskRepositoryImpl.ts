import type { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import type { ITask, CreateTaskInput, UpdateTaskInput } from '../../domain/models/ITask';
import { LocalDataSource } from '../datasources/LocalDataSource';
import { RemoteDataSource } from '../datasources/RemoteDataSource';

/**
 * Offline-first TaskRepository.
 *
 * READ  → always from local DB (fast, reactive)
 * WRITE → write to local DB first (pendingSync=true), then attempt remote
 * SYNC  → pull remote → upsert local | push pending → clear flags
 */
export class TaskRepositoryImpl implements ITaskRepository {

  async getTasks(): Promise<ITask[]> {
    return LocalDataSource.getAll();
  }

  async getTaskById(id: string): Promise<ITask | null> {
    return LocalDataSource.getById(id);
  }

  async createTask(input: CreateTaskInput): Promise<ITask> {
    // Write locally first (offline safe)
    const local = await LocalDataSource.create(input);
    // Attempt remote push in background (best effort)
    this._tryRemoteCreate(local.id, input);
    return local;
  }

  async updateTask(id: string, input: UpdateTaskInput): Promise<ITask> {
    const updated = await LocalDataSource.update(id, input);
    this._tryRemoteUpdate(id, input);
    return updated;
  }

  async deleteTask(id: string): Promise<void> {
    const task = await LocalDataSource.getById(id);
    await LocalDataSource.delete(id);
    if (task?.id && !task.localOnly) {
      this._tryRemoteDelete(task.id);
    }
  }

  async deleteAllTasks(): Promise<void> {
    await LocalDataSource.deleteAll();
  }

  async syncRemote(): Promise<number> {
    const remoteTasks = await RemoteDataSource.fetchAll();
    await LocalDataSource.upsertBatch(remoteTasks);
    return remoteTasks.length;
  }

  async pushPending(): Promise<void> {
    const pending = await LocalDataSource.getPending();
    for (const task of pending) {
      try {
        if (task.localOnly) {
          await RemoteDataSource.create(task.title, task.userId);
        } else {
          await RemoteDataSource.update(task.id, {
            title: task.title,
            completed: task.completed,
          });
        }
        await LocalDataSource.clearPendingFlag(task.id);
      } catch (err) {
        // Keep as pending — will retry on next push
        console.warn(`[Repo] Could not push task ${task.id}:`, err);
      }
    }
  }

  // ── Private best-effort remote helpers ───────────────────────────────────

  private _tryRemoteCreate(localId: string, input: CreateTaskInput): void {
    RemoteDataSource.create(input.title, input.userId)
      .then(() => LocalDataSource.clearPendingFlag(localId))
      .catch(() => {/* remains pending */});
  }

  private _tryRemoteUpdate(id: string, input: UpdateTaskInput): void {
    RemoteDataSource.update(id, input)
      .then(() => LocalDataSource.clearPendingFlag(id))
      .catch(() => {/* remains pending */});
  }

  private _tryRemoteDelete(id: string): void {
    RemoteDataSource.delete(id).catch(() => {/* ignore */});
  }
}
