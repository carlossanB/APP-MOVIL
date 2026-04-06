/**
 * Domain model — pure TypeScript interface (no DB coupling).
 */
export interface ITask {
  id: string;
  title: string;
  completed: boolean;
  userId: number;
  createdAt: number; // Unix ms
  updatedAt: number; // Unix ms
  /** true when local mutation awaits network sync */
  pendingSync: boolean;
  /** true when record was created offline and not yet pushed */
  localOnly: boolean;
  photoUri?: string;
}

export type CreateTaskInput = Pick<ITask, 'title' | 'userId'> & Partial<Pick<ITask, 'photoUri'>>;
export type UpdateTaskInput = Partial<Pick<ITask, 'title' | 'completed' | 'photoUri'>>;
