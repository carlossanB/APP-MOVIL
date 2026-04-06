import { Q } from '@nozbe/watermelondb';
import { database } from '../database/database';
import { TaskModel } from '../database/TaskModel';
import type { ITask, CreateTaskInput, UpdateTaskInput } from '../../domain/models/ITask';

/**
 * Maps a WatermelonDB TaskModel to the domain ITask interface.
 */
function toITask(model: TaskModel): ITask {
  return {
    id: model.id,
    title: model.title,
    completed: model.completed,
    userId: model.userId,
    createdAt: model.createdAt instanceof Date ? model.createdAt.getTime() : (model.createdAt as number),
    updatedAt: model.updatedAt instanceof Date ? model.updatedAt.getTime() : (model.updatedAt as number),
    pendingSync: model.pendingSync,
    localOnly: model.localOnly,
    photoUri: model.photoUri ?? undefined,
  };
}

const tasksCollection = database.get<TaskModel>('tasks');

export const LocalDataSource = {
  async getAll(): Promise<ITask[]> {
    const records = await tasksCollection.query(Q.sortBy('created_at', Q.desc)).fetch();
    return records.map(toITask);
  },

  async deleteAll(): Promise<void> {
    const records = await tasksCollection.query().fetch();
    await database.write(async () => {
      const deleted = records.map(r => r.prepareDestroyPermanently());
      await database.batch(...deleted);
    });
  },

  async getById(id: string): Promise<ITask | null> {
    try {
      const record = await tasksCollection.find(id);
      return toITask(record);
    } catch {
      return null;
    }
  },

  async create(input: CreateTaskInput): Promise<ITask> {
    let result!: TaskModel;
    await database.write(async () => {
      result = await tasksCollection.create(record => {
        record.title = input.title;
        record.completed = false;
        record.userId = input.userId;
        record.updatedAt = new Date();
        record.pendingSync = true;
        record.localOnly = true;
        if (input.photoUri) record.photoUri = input.photoUri;
      });
    });
    return toITask(result);
  },

  async update(id: string, input: UpdateTaskInput): Promise<ITask> {
    const record = await tasksCollection.find(id);
    await database.write(async () => {
      await record.update(r => {
        if (input.title !== undefined) r.title = input.title;
        if (input.completed !== undefined) r.completed = input.completed;
        if (input.photoUri !== undefined) r.photoUri = input.photoUri === '' ? null : input.photoUri;
        r.updatedAt = new Date();
        r.pendingSync = true;
      });
    });
    return toITask(record);
  },

  async delete(id: string): Promise<void> {
    const record = await tasksCollection.find(id);
    await database.write(async () => {
      await record.markAsDeleted();
      await record.destroyPermanently();
    });
  },

  /**
   * Upsert a batch of ITask objects from remote.
   * Matches by remoteId; inserts if not found, updates if found.
   */
  async upsertBatch(tasks: ITask[]): Promise<void> {
    await database.write(async () => {
      for (const task of tasks) {
        const existing = await tasksCollection
          .query(Q.where('remote_id', task.id))
          .fetch();

        if (existing.length > 0) {
          await existing[0].update(r => {
            r.title = task.title;
            r.completed = task.completed;
            r.userId = task.userId;
            r.updatedAt = new Date(task.updatedAt);
            r.pendingSync = false;
            r.localOnly = false;
          });
        } else {
          await tasksCollection.create(r => {
            r.remoteId = task.id;
            r.title = task.title;
            r.completed = task.completed;
            r.userId = task.userId;
            r.updatedAt = new Date(task.updatedAt);
            r.pendingSync = false;
            r.localOnly = false;
          });
        }
      }
    });
  },

  /**
   * Returns all records that have pendingSync = true.
   */
  async getPending(): Promise<ITask[]> {
    const records = await tasksCollection
      .query(Q.where('pending_sync', true))
      .fetch();
    return records.map(toITask);
  },

  /**
   * Clears pendingSync flag after a successful remote push.
   */
  async clearPendingFlag(id: string): Promise<void> {
    const record = await tasksCollection.find(id);
    await database.write(async () => {
      await record.update(r => {
        r.pendingSync = false;
        r.localOnly = false;
      });
    });
  },
};
