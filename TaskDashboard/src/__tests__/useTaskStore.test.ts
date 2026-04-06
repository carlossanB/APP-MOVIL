/**
 * useTaskStore Unit Tests
 *
 * Tests the Zustand store actions using the actual store + mocked use cases.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../../data/repositories/TaskRepositoryImpl');
jest.mock('../../data/sync/SyncService', () => ({
  SyncService: {
    pullAndSync: jest.fn().mockResolvedValue(5),
    pushPending: jest.fn().mockResolvedValue(undefined),
    startListening: jest.fn(),
    stopListening: jest.fn(),
  },
}));

import { act } from '@testing-library/react-native';
import { useTaskStore } from '../../presentation/stores/useTaskStore';
import { TaskRepositoryImpl } from '../../data/repositories/TaskRepositoryImpl';
import type { ITask } from '../../domain/models/ITask';

const MockRepository = TaskRepositoryImpl as jest.MockedClass<typeof TaskRepositoryImpl>;

const sampleTasks: ITask[] = [
  { id: '1', title: 'Task A', completed: false, userId: 1, createdAt: 0, updatedAt: 0, pendingSync: false, localOnly: false },
  { id: '2', title: 'Task B', completed: true,  userId: 1, createdAt: 0, updatedAt: 0, pendingSync: false, localOnly: false },
];

// ── Setup ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  // Reset Zustand store to initial state before each test
  useTaskStore.setState({
    tasks: [],
    isLoading: false,
    isSyncing: false,
    isOffline: false,
    error: null,
  });

  MockRepository.prototype.getTasks = jest.fn().mockResolvedValue(sampleTasks);
  MockRepository.prototype.syncRemote = jest.fn().mockResolvedValue(2);
  MockRepository.prototype.createTask = jest.fn().mockResolvedValue(sampleTasks[0]);
  MockRepository.prototype.deleteTask = jest.fn().mockResolvedValue(undefined);
});

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('useTaskStore', () => {

  it('loadTasks() — populates tasks from repository', async () => {
    await act(async () => {
      await useTaskStore.getState().loadTasks();
    });

    const { tasks, isLoading, error } = useTaskStore.getState();
    expect(tasks).toHaveLength(2);
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('syncTasks() — syncs and refreshes task list', async () => {
    await act(async () => {
      await useTaskStore.getState().syncTasks();
    });

    const { tasks, isSyncing } = useTaskStore.getState();
    expect(isSyncing).toBe(false);
    expect(tasks).toHaveLength(2);
  });

  it('syncTasks() — does not double-sync if already syncing', async () => {
    useTaskStore.setState({ isSyncing: true });

    await act(async () => {
      await useTaskStore.getState().syncTasks();
    });

    // syncRemote should NOT be called if already syncing
    expect(MockRepository.prototype.syncRemote).not.toHaveBeenCalled();
  });

  it('deleteTask() — removes task from state optimistically', async () => {
    useTaskStore.setState({ tasks: sampleTasks });

    await act(async () => {
      await useTaskStore.getState().deleteTask('1');
    });

    const { tasks } = useTaskStore.getState();
    expect(tasks.find(t => t.id === '1')).toBeUndefined();
    expect(tasks).toHaveLength(1);
  });

  it('setOffline() — updates offline flag', () => {
    useTaskStore.getState().setOffline(true);
    expect(useTaskStore.getState().isOffline).toBe(true);
  });

  it('clearError() — resets error to null', () => {
    useTaskStore.setState({ error: 'Something went wrong' });
    useTaskStore.getState().clearError();
    expect(useTaskStore.getState().error).toBeNull();
  });
});
