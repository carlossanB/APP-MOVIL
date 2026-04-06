import type { ITask, CreateTaskInput, UpdateTaskInput } from '../models/ITask';

/**
 * Abstract contract for the Task Repository.
 * The UI layer depends ONLY on this interface — never on the concrete implementation.
 */
export interface ITaskRepository {
  getTasks(): Promise<ITask[]>;
  getTaskById(id: string): Promise<ITask | null>;
  createTask(input: CreateTaskInput): Promise<ITask>;
  updateTask(id: string, input: UpdateTaskInput): Promise<ITask>;
  deleteTask(id: string): Promise<void>;
  deleteAllTasks(): Promise<void>;
  /** Pull remote data and upsert locally. Returns number of synced records. */
  syncRemote(): Promise<number>;
  /** Push locally-pending mutations to the remote API. */
  pushPending(): Promise<void>;
}
