/**
 * TaskRepositoryImpl Unit Tests
 *
 * Validates offline-first read/write logic by mocking the two datasources.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../../data/datasources/LocalDataSource');
jest.mock('../../data/datasources/RemoteDataSource');

import { TaskRepositoryImpl } from '../../data/repositories/TaskRepositoryImpl';
import { LocalDataSource } from '../../data/datasources/LocalDataSource';
import { RemoteDataSource } from '../../data/datasources/RemoteDataSource';
import type { ITask } from '../../domain/models/ITask';

const mockLocal = LocalDataSource as jest.Mocked<typeof LocalDataSource>;
const mockRemote = RemoteDataSource as jest.Mocked<typeof RemoteDataSource>;

const sampleTask: ITask = {
  id: 'local-1',
  title: 'Write tests',
  completed: false,
  userId: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  pendingSync: true,
  localOnly: true,
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('TaskRepositoryImpl', () => {
  let repo: TaskRepositoryImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new TaskRepositoryImpl();
  });

  // ── getTasks ────────────────────────────────────────────────────────────────
  describe('getTasks()', () => {
    it('reads ONLY from local datasource (offline-first)', async () => {
      mockLocal.getAll.mockResolvedValue([sampleTask]);

      const result = await repo.getTasks();

      expect(mockLocal.getAll).toHaveBeenCalledTimes(1);
      expect(mockRemote.fetchAll).not.toHaveBeenCalled();
      expect(result).toEqual([sampleTask]);
    });
  });

  // ── createTask ──────────────────────────────────────────────────────────────
  describe('createTask()', () => {
    it('writes locally first and fires remote in background', async () => {
      mockLocal.create.mockResolvedValue(sampleTask);
      mockRemote.create.mockResolvedValue({ ...sampleTask, id: 'remote-99' });
      mockLocal.clearPendingFlag.mockResolvedValue(undefined);

      const result = await repo.createTask({ title: 'Write tests', userId: 1 });

      // Local write happens synchronously
      expect(mockLocal.create).toHaveBeenCalledWith({ title: 'Write tests', userId: 1 });
      expect(result).toEqual(sampleTask);
    });

    it('still resolves with local record even if remote fails', async () => {
      mockLocal.create.mockResolvedValue(sampleTask);
      mockRemote.create.mockRejectedValue(new Error('NO_NETWORK'));

      const result = await repo.createTask({ title: 'Offline task', userId: 1 });

      expect(result).toEqual(sampleTask);
    });
  });

  // ── syncRemote ──────────────────────────────────────────────────────────────
  describe('syncRemote()', () => {
    it('fetches from remote and upserts to local', async () => {
      const remoteTasks: ITask[] = [sampleTask, { ...sampleTask, id: 'remote-2', title: 'Another' }];
      mockRemote.fetchAll.mockResolvedValue(remoteTasks);
      mockLocal.upsertBatch.mockResolvedValue(undefined);

      const count = await repo.syncRemote();

      expect(mockRemote.fetchAll).toHaveBeenCalledTimes(1);
      expect(mockLocal.upsertBatch).toHaveBeenCalledWith(remoteTasks);
      expect(count).toBe(2);
    });
  });

  // ── pushPending ─────────────────────────────────────────────────────────────
  describe('pushPending()', () => {
    it('pushes localOnly tasks via remote.create and clears the flag', async () => {
      const pendingTask: ITask = { ...sampleTask, localOnly: true, pendingSync: true };
      mockLocal.getPending.mockResolvedValue([pendingTask]);
      mockRemote.create.mockResolvedValue({ ...pendingTask, id: 'remote-10' });
      mockLocal.clearPendingFlag.mockResolvedValue(undefined);

      await repo.pushPending();

      expect(mockRemote.create).toHaveBeenCalledWith(pendingTask.title, pendingTask.userId);
      expect(mockLocal.clearPendingFlag).toHaveBeenCalledWith(pendingTask.id);
    });

    it('skips clearing flag if remote push fails (keeps pending)', async () => {
      const pendingTask: ITask = { ...sampleTask, localOnly: true, pendingSync: true };
      mockLocal.getPending.mockResolvedValue([pendingTask]);
      mockRemote.create.mockRejectedValue(new Error('NO_NETWORK'));

      await expect(repo.pushPending()).resolves.toBeUndefined();
      expect(mockLocal.clearPendingFlag).not.toHaveBeenCalled();
    });
  });
});
