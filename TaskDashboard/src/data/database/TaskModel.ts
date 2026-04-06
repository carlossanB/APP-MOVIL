import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class TaskModel extends Model {
  static table = 'tasks';

  @field('remote_id') remoteId!: string | null;
  @field('title') title!: string;
  @field('completed') completed!: boolean;
  @field('user_id') userId!: number;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @field('pending_sync') pendingSync!: boolean;
  @field('local_only') localOnly!: boolean;
  @field('photo_uri') photoUri!: string | null;
}
