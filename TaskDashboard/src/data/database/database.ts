import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { TaskModel } from './TaskModel';

const adapter = new SQLiteAdapter({
  schema,
  migrations: undefined,
  jsi: false, // JSI disabled for RN New Architecture compatibility
  onSetUpError: error => {
    console.error('[WatermelonDB] Setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [TaskModel],
});
