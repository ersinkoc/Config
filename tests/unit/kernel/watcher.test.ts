/**
 * Tests for ConfigFileWatcher implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigFileWatcher } from '../../../src/kernel/watcher.js';

// Mock fs.watch
const mockWatcherInstance = {
  close: vi.fn(),
};

vi.mock('node:fs', () => ({
  watch: vi.fn(() => mockWatcherInstance),
  unwatchFile: vi.fn(),
}));

describe('ConfigFileWatcher', () => {
  let watcher: ConfigFileWatcher;
  let fsWatch: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockWatcherInstance.close.mockClear();

    const fs = await import('node:fs');
    fsWatch = fs.watch as ReturnType<typeof vi.fn>;

    watcher = new ConfigFileWatcher();
  });

  afterEach(() => {
    watcher.close();
    vi.useRealTimers();
  });

  describe('watch', () => {
    it('should register file watcher', () => {
      const callback = vi.fn();
      watcher.watch('/path/to/file.yaml', callback);

      expect(fsWatch).toHaveBeenCalledWith('/path/to/file.yaml', expect.any(Function));
      expect(watcher.getWatchedFiles()).toContain('/path/to/file.yaml');
    });

    it('should replace existing watcher for same file', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      watcher.watch('/path/to/file.yaml', callback1);
      watcher.watch('/path/to/file.yaml', callback2);

      expect(mockWatcherInstance.close).toHaveBeenCalled();
      expect(watcher.getWatchedFiles().length).toBe(1);
    });

    it('should handle watch errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const fs = await import('node:fs');
      (fs.watch as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
        throw new Error('Watch failed');
      });

      const callback = vi.fn();
      expect(() => watcher.watch('/invalid/path', callback)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('unwatch', () => {
    it('should close watcher and remove file', () => {
      const callback = vi.fn();
      watcher.watch('/path/to/file.yaml', callback);

      watcher.unwatch('/path/to/file.yaml');

      expect(mockWatcherInstance.close).toHaveBeenCalled();
      expect(watcher.getWatchedFiles()).not.toContain('/path/to/file.yaml');
    });

    it('should not throw when unwatching non-existent file', () => {
      expect(() => watcher.unwatch('/nonexistent')).not.toThrow();
    });

    it('should clear debounce timer when unwatching', () => {
      const callback = vi.fn();
      watcher.watch('/path/to/file.yaml', callback);

      // Trigger a change to start a debounce timer
      const watchCallback = fsWatch.mock.calls[0][1];
      watchCallback('change', 'file.yaml');

      // Unwatch should clear the timer
      watcher.unwatch('/path/to/file.yaml');

      // Advance timers past debounce period
      vi.advanceTimersByTime(400);

      // Callback should not have been called because timer was cleared
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should close all watchers', () => {
      watcher.watch('/path/to/file1.yaml', vi.fn());
      watcher.watch('/path/to/file2.yaml', vi.fn());

      watcher.close();

      expect(watcher.getWatchedFiles()).toHaveLength(0);
    });
  });

  describe('getWatchedFiles', () => {
    it('should return empty array when no files watched', () => {
      expect(watcher.getWatchedFiles()).toEqual([]);
    });

    it('should return all watched files', () => {
      watcher.watch('/path/to/file1.yaml', vi.fn());
      watcher.watch('/path/to/file2.json', vi.fn());

      const files = watcher.getWatchedFiles();
      expect(files).toContain('/path/to/file1.yaml');
      expect(files).toContain('/path/to/file2.json');
      expect(files).toHaveLength(2);
    });
  });

  describe('handleFileChange', () => {
    it('should debounce change events', () => {
      const callback = vi.fn();
      watcher.watch('/path/to/file.yaml', callback);

      // Get the watch callback
      const watchCallback = fsWatch.mock.calls[0][1];

      // Trigger multiple changes quickly
      watchCallback('change', 'file.yaml');
      watchCallback('change', 'file.yaml');
      watchCallback('change', 'file.yaml');

      // Advance timers past debounce period
      vi.advanceTimersByTime(400);

      // Should only be called once due to debouncing
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should map change event type correctly', () => {
      const callback = vi.fn();
      watcher.watch('/path/to/file.yaml', callback);

      const watchCallback = fsWatch.mock.calls[0][1];
      watchCallback('change', 'file.yaml');

      vi.advanceTimersByTime(400);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'change',
          path: '/path/to/file.yaml',
        })
      );
    });

    it('should map rename event type correctly', () => {
      const callback = vi.fn();
      watcher.watch('/path/to/file.yaml', callback);

      const watchCallback = fsWatch.mock.calls[0][1];
      watchCallback('rename', 'file.yaml');

      vi.advanceTimersByTime(400);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rename',
          path: '/path/to/file.yaml',
        })
      );
    });

    it('should include timestamp and metadata in event', () => {
      const callback = vi.fn();
      watcher.watch('/path/to/file.yaml', callback);

      const watchCallback = fsWatch.mock.calls[0][1];
      const beforeTime = Date.now();
      watchCallback('change', 'file.yaml');

      vi.advanceTimersByTime(400);

      const event = callback.mock.calls[0][0];
      expect(event.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(event.metadata).toEqual({ originalEvent: 'change' });
    });

    it('should catch and log errors in callback', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const errorCallback = () => {
        throw new Error('Callback error');
      };

      watcher.watch('/path/to/file.yaml', errorCallback);

      const watchCallback = fsWatch.mock.calls[0][1];
      watchCallback('change', 'file.yaml');

      vi.advanceTimersByTime(400);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in file watch callback:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
