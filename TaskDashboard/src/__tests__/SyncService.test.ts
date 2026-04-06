/**
 * SyncService Unit Tests
 *
 * Tests the sync logic in isolation by mocking the TaskRepositoryImpl
 * and verifying pull, error handling, and push-pending behaviors.
 */

// ── Mock setup ───────────────────────────────────────────────────────────────

// Mock the entire repository
jest.mock('../../data/repositories/TaskRepositoryImpl');
// Mock NetInfo so startListening() doesn't touch native modules
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()), // returns unsubscribe fn
}));

import { SyncService } from '../../data/sync/SyncService';
import { TaskRepositoryImpl } from '../../data/repositories/TaskRepositoryImpl';

const MockRepository = TaskRepositoryImpl as jest.MockedClass<typeof TaskRepositoryImpl>;

// ── Test Suite ───────────────────────────────────────────────────────────────

describe('SyncService', () => {
  let mockSyncRemote: jest.Mock;
  let mockPushPending: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSyncRemote = jest.fn().mockResolvedValue(42);
    mockPushPending = jest.fn().mockResolvedValue(undefined);

    MockRepository.prototype.syncRemote = mockSyncRemote;
    MockRepository.prototype.pushPending = mockPushPending;
  });

  // ── pullAndSync ─────────────────────────────────────────────────────────────

  describe('pullAndSync()', () => {
    it('returns the count of synced records on success', async () => {
      const count = await SyncService.pullAndSync();
      expect(count).toBe(42);
      expect(mockSyncRemote).toHaveBeenCalledTimes(1);
    });

    it('returns 0 and does NOT throw when network is unavailable', async () => {
      mockSyncRemote.mockRejectedValueOnce(new Error('NO_NETWORK'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const count = await SyncService.pullAndSync();

      expect(count).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Sync] No network — serving data from local cache.',
      );
      consoleSpy.mockRestore();
    });

    it('re-throws unexpected errors (non-network failures)', async () => {
      mockSyncRemote.mockRejectedValueOnce(new Error('DB_CORRUPT'));

      await expect(SyncService.pullAndSync()).rejects.toThrow('DB_CORRUPT');
    });
  });

  // ── pushPending ─────────────────────────────────────────────────────────────

  describe('pushPending()', () => {
    it('calls repository.pushPending()', async () => {
      await SyncService.pushPending();
      expect(mockPushPending).toHaveBeenCalledTimes(1);
    });

    it('does NOT throw when pushPending fails — logs a warning', async () => {
      mockPushPending.mockRejectedValueOnce(new Error('SERVER_ERROR'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await expect(SyncService.pushPending()).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  // ── startListening / stopListening ──────────────────────────────────────────

  describe('startListening() / stopListening()', () => {
    it('subscribes to NetInfo without throwing', () => {
      expect(() => SyncService.startListening()).not.toThrow();
    });

    it('does not subscribe twice if startListening is called multiple times', () => {
      const NetInfo = require('@react-native-community/netinfo');
      SyncService.startListening();
      SyncService.startListening(); // second call should be a no-op
      expect(NetInfo.addEventListener).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes on stopListening()', () => {
      const mockUnsub = jest.fn();
      const NetInfo = require('@react-native-community/netinfo');
      (NetInfo.addEventListener as jest.Mock).mockReturnValueOnce(mockUnsub);

      SyncService.startListening();
      SyncService.stopListening();

      expect(mockUnsub).toHaveBeenCalledTimes(1);
    });
  });
});
