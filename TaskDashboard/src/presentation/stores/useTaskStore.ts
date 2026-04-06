import { create } from 'zustand';
import { TaskRepositoryImpl } from '../../data/repositories/TaskRepositoryImpl';
import { SyncService } from '../../data/sync/SyncService';
import { GetTasksUseCase } from '../../domain/usecases/GetTasksUseCase';
import { CreateTaskUseCase } from '../../domain/usecases/CreateTaskUseCase';
import { UpdateTaskUseCase } from '../../domain/usecases/UpdateTaskUseCase';
import { DeleteTaskUseCase } from '../../domain/usecases/DeleteTaskUseCase';
import type { ITask, CreateTaskInput, UpdateTaskInput } from '../../domain/models/ITask';

// ── Dependency injection (composition root) ──────────────────────────────────
const repository = new TaskRepositoryImpl();
const getTasks = new GetTasksUseCase(repository);
const createTask = new CreateTaskUseCase(repository);
const updateTask = new UpdateTaskUseCase(repository);
const deleteTask = new DeleteTaskUseCase(repository);

// ── Zustand Store ────────────────────────────────────────────────────────────
export type FilterType = 'all' | 'completed' | 'pending';

interface TaskState {
  tasks: ITask[];
  isLoading: boolean;
  isSyncing: boolean;
  isOffline: boolean;
  error: string | null;
  filterType: FilterType;

  loadTasks: () => Promise<void>;
  syncTasks: () => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<void>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  deleteAllTasks: () => Promise<void>;
  setOffline: (offline: boolean) => void;
  clearError: () => void;
  setFilterType: (filter: FilterType) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  isSyncing: false,
  isOffline: false,
  error: null,
  filterType: 'all',

  loadTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await getTasks.execute();
      set({ tasks, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  syncTasks: async () => {
    if (get().isSyncing) return;
    set({ isSyncing: true, error: null });
    try {
      await SyncService.pullAndSync();
      const tasks = await getTasks.execute();
      set({ tasks, isSyncing: false });
    } catch (err) {
      set({ error: String(err), isSyncing: false });
    }
  },

  createTask: async (input: CreateTaskInput) => {
    try {
      await createTask.execute(input);
      const tasks = await getTasks.execute();
      set({ tasks });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  updateTask: async (id: string, input: UpdateTaskInput) => {
    try {
      await updateTask.execute(id, input);
      const tasks = await getTasks.execute();
      set({ tasks });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  deleteTask: async (id: string) => {
    try {
      await deleteTask.execute(id);
      set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
    } catch (err) {
      set({ error: String(err) });
    }
  },

  deleteAllTasks: async () => {
    try {
      await repository.deleteAllTasks();
      set({ tasks: [] });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  setOffline: (offline: boolean) => set({ isOffline: offline }),
  clearError: () => set({ error: null }),
  setFilterType: (filter: FilterType) => set({ filterType: filter }),
}));
