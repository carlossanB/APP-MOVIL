import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { TaskRepositoryImpl } from '../repositories/TaskRepositoryImpl';

const repository = new TaskRepositoryImpl();
let _unsubscribe: (() => void) | null = null;

/**
 * SyncService — manages pull-to-refresh and auto push-on-reconnect.
 *
 * Usage:
 *   SyncService.startListening(); // Call once on app start
 *   await SyncService.pullAndSync();
 *   SyncService.stopListening();
 */
export const SyncService = {
  /**
   * Fetch remote todos and upsert into WatermelonDB.
   * @returns number of synced records
   */
  async pullAndSync(): Promise<number> {
    try {
      const count = await repository.syncRemote();
      console.log(`[Sync] Pulled ${count} records from remote.`);
      return count;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === 'NO_NETWORK') {
        console.warn('[Sync] No network — serving data from local cache.');
        return 0;
      }
      throw error;
    }
  },

  /**
   * Push locally-pending mutations to the remote API.
   */
  async pushPending(): Promise<void> {
    try {
      await repository.pushPending();
    } catch (error) {
      console.warn('[Sync] Push pending failed:', error);
    }
  },

  /**
   * Subscribe to NetInfo — automatically push pending tasks when
   * connectivity is restored.
   */
  startListening(): void {
    if (_unsubscribe) return; // already listening

    _unsubscribe = NetInfo.addEventListener(async (state: NetInfoState) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      if (isConnected) {
        console.log('[Sync] Network restored — pushing pending tasks...');
        await SyncService.pushPending();
      }
    });
  },

  stopListening(): void {
    _unsubscribe?.();
    _unsubscribe = null;
  },
};
