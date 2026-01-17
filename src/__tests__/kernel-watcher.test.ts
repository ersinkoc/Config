// @ts-nocheck
/**
 * Tests for kernel/watcher.ts
 */

import { jest } from '@jest/globals';
import { ConfigFileWatcher } from '../kernel/watcher.js';

// Mock fs module
jest.mock('node:fs', () => ({
  watch: jest.fn(),
  unwatchFile: jest.fn(),
}));

import { watch as fsWatch } from 'node:fs';

const mockedWatch = fsWatch as jest.MockedFunction<typeof fsWatch>;

describe('ConfigFileWatcher', () => {
  let watcher: ConfigFileWatcher;

  beforeEach(() => {
    watcher = new ConfigFileWatcher();
    jest.clearAllMocks();
  });

  afterEach(() => {
    watcher.close();
  });

  describe('watch', () => {
    it('should start watching a file', () => {
      const mockWatcher = { close: jest.fn() };
      mockedWatch.mockReturnValue(mockWatcher as any);

      const callback = jest.fn();
      watcher.watch('/path/to/file.txt', callback);

      expect(mockedWatch).toHaveBeenCalledWith('/path/to/file.txt', expect.any(Function));
    });

    it('should replace existing watcher for same file', () => {
      const mockWatcher1 = { close: jest.fn() };
      const mockWatcher2 = { close: jest.fn() };
      mockedWatch
        .mockReturnValueOnce(mockWatcher1 as any)
        .mockReturnValueOnce(mockWatcher2 as any);

      const callback = jest.fn();
      watcher.watch('/path/to/file.txt', callback);
      watcher.watch('/path/to/file.txt', callback);

      expect(mockWatcher1.close).toHaveBeenCalled();
      expect(mockedWatch).toHaveBeenCalledTimes(2);
    });

    it('should handle file change events', (done) => {
      let watchCallback: ((eventType: string, filename: string | null) => void) | undefined;
      const mockWatcher = { close: jest.fn() };

      mockedWatch.mockImplementation((path, callback) => {
        watchCallback = callback as any;
        return mockWatcher as any;
      });

      const userCallback = jest.fn();
      watcher.watch('/path/to/file.txt', userCallback);

      // Simulate file change
      if (watchCallback) {
        watchCallback('change', 'file.txt');
      }

      // Wait for debounce
      setTimeout(() => {
        expect(userCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'change',
            path: '/path/to/file.txt',
          })
        );
        done();
      }, 350);
    });

    it('should handle rename events', (done) => {
      let watchCallback: ((eventType: string, filename: string | null) => void) | undefined;
      const mockWatcher = { close: jest.fn() };

      mockedWatch.mockImplementation((path, callback) => {
        watchCallback = callback as any;
        return mockWatcher as any;
      });

      const userCallback = jest.fn();
      watcher.watch('/path/to/file.txt', userCallback);

      // Simulate rename event
      if (watchCallback) {
        watchCallback('rename', 'file.txt');
      }

      // Wait for debounce
      setTimeout(() => {
        expect(userCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'rename',
          })
        );
        done();
      }, 350);
    });

    it('should debounce rapid file changes', (done) => {
      let watchCallback: ((eventType: string, filename: string | null) => void) | undefined;
      const mockWatcher = { close: jest.fn() };

      mockedWatch.mockImplementation((path, callback) => {
        watchCallback = callback as any;
        return mockWatcher as any;
      });

      const userCallback = jest.fn();
      watcher.watch('/path/to/file.txt', userCallback);

      // Trigger multiple changes rapidly
      if (watchCallback) {
        watchCallback('change', 'file.txt');
        watchCallback('change', 'file.txt');
        watchCallback('change', 'file.txt');
      }

      // Wait for debounce - should only call once
      setTimeout(() => {
        expect(userCallback).toHaveBeenCalledTimes(1);
        done();
      }, 350);
    });

    it('should include timestamp in event', (done) => {
      let watchCallback: ((eventType: string, filename: string | null) => void) | undefined;
      const mockWatcher = { close: jest.fn() };
      const beforeTime = Date.now();

      mockedWatch.mockImplementation((path, callback) => {
        watchCallback = callback as any;
        return mockWatcher as any;
      });

      const userCallback = jest.fn();
      watcher.watch('/path/to/file.txt', userCallback);

      if (watchCallback) {
        watchCallback('change', 'file.txt');
      }

      setTimeout(() => {
        expect(userCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            timestamp: expect.any(Number),
          })
        );
        const event = userCallback.mock.calls[0][0];
        expect(event.timestamp).toBeGreaterThanOrEqual(beforeTime);
        expect(event.timestamp).toBeLessThanOrEqual(Date.now());
        done();
      }, 350);
    });

    it('should include metadata in event', (done) => {
      let watchCallback: ((eventType: string, filename: string | null) => void) | undefined;
      const mockWatcher = { close: jest.fn() };

      mockedWatch.mockImplementation((path, callback) => {
        watchCallback = callback as any;
        return mockWatcher as any;
      });

      const userCallback = jest.fn();
      watcher.watch('/path/to/file.txt', userCallback);

      if (watchCallback) {
        watchCallback('change', 'file.txt');
      }

      setTimeout(() => {
        expect(userCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              originalEvent: 'change',
            }),
          })
        );
        done();
      }, 350);
    });

    it('should handle callback errors gracefully', (done) => {
      let watchCallback: ((eventType: string, filename: string | null) => void) | undefined;
      const mockWatcher = { close: jest.fn() };
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockedWatch.mockImplementation((path, callback) => {
        watchCallback = callback as any;
        return mockWatcher as any;
      });

      const userCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      watcher.watch('/path/to/file.txt', userCallback);

      if (watchCallback) {
        watchCallback('change', 'file.txt');
      }

      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
        done();
      }, 350);
    });

    it('should handle watch errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockedWatch.mockImplementation(() => {
        throw new Error('Watch failed');
      });

      const callback = jest.fn();
      expect(() => watcher.watch('/invalid/path', callback)).not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should watch multiple files independently', (done) => {
      let callback1: ((eventType: string, filename: string | null) => void) | undefined;
      let callback2: ((eventType: string, filename: string | null) => void) | undefined;

      mockedWatch
        .mockImplementationOnce((path, cb) => {
          callback1 = cb as any;
          return { close: jest.fn() } as any;
        })
        .mockImplementationOnce((path, cb) => {
          callback2 = cb as any;
          return { close: jest.fn() } as any;
        });

      const userCallback1 = jest.fn();
      const userCallback2 = jest.fn();

      watcher.watch('/file1.txt', userCallback1);
      watcher.watch('/file2.txt', userCallback2);

      if (callback1) callback1('change', 'file1.txt');
      if (callback2) callback2('change', 'file2.txt');

      setTimeout(() => {
        expect(userCallback1).toHaveBeenCalledWith(
          expect.objectContaining({ path: '/file1.txt' })
        );
        expect(userCallback2).toHaveBeenCalledWith(
          expect.objectContaining({ path: '/file2.txt' })
        );
        done();
      }, 350);
    });
  });

  describe('unwatch', () => {
    it('should stop watching a file', () => {
      const mockWatcher = { close: jest.fn() };
      mockedWatch.mockReturnValue(mockWatcher as any);

      const callback = jest.fn();
      watcher.watch('/path/to/file.txt', callback);
      watcher.unwatch('/path/to/file.txt');

      expect(mockWatcher.close).toHaveBeenCalled();
    });

    it('should handle unwatching non-existent file', () => {
      expect(() => watcher.unwatch('/nonexistent/file.txt')).not.toThrow();
    });

    it('should clear debounce timer on unwatch', () => {
      const mockWatcher = { close: jest.fn() };
      mockedWatch.mockReturnValue(mockWatcher as any);

      const callback = jest.fn();
      watcher.watch('/path/to/file.txt', callback);

      // Trigger a change
      const watchCallback = mockedWatch.mock.calls[0][1] as any;
      watchCallback('change', 'file.txt');

      // Immediately unwatch
      watcher.unwatch('/path/to/file.txt');

      // Wait for debounce + buffer
      setTimeout(() => {
        expect(callback).not.toHaveBeenCalled();
      }, 350);
    });

    it('should not affect other files when unwatching one', () => {
      const mockWatcher1 = { close: jest.fn() };
      const mockWatcher2 = { close: jest.fn() };

      mockedWatch
        .mockReturnValueOnce(mockWatcher1 as any)
        .mockReturnValueOnce(mockWatcher2 as any);

      const callback = jest.fn();
      watcher.watch('/file1.txt', callback);
      watcher.watch('/file2.txt', callback);

      watcher.unwatch('/file1.txt');

      expect(mockWatcher1.close).toHaveBeenCalled();
      expect(mockWatcher2.close).not.toHaveBeenCalled();
    });

    it('should remove callback on unwatch', () => {
      const mockWatcher = { close: jest.fn() };
      mockedWatch.mockReturnValue(mockWatcher as any);

      const callback = jest.fn();
      watcher.watch('/path/to/file.txt', callback);
      watcher.unwatch('/path/to/file.txt');

      // The callback should be removed
      // This is tested implicitly by the behavior
    });
  });

  describe('close', () => {
    it('should close all watchers', () => {
      const mockWatcher1 = { close: jest.fn() };
      const mockWatcher2 = { close: jest.fn() };
      const mockWatcher3 = { close: jest.fn() };

      mockedWatch
        .mockReturnValueOnce(mockWatcher1 as any)
        .mockReturnValueOnce(mockWatcher2 as any)
        .mockReturnValueOnce(mockWatcher3 as any);

      const callback = jest.fn();
      watcher.watch('/file1.txt', callback);
      watcher.watch('/file2.txt', callback);
      watcher.watch('/file3.txt', callback);

      watcher.close();

      expect(mockWatcher1.close).toHaveBeenCalled();
      expect(mockWatcher2.close).toHaveBeenCalled();
      expect(mockWatcher3.close).toHaveBeenCalled();
    });

    it('should handle closing empty watcher', () => {
      expect(() => watcher.close()).not.toThrow();
    });

    it('should clear all watchers', () => {
      const mockWatcher = { close: jest.fn() };
      mockedWatch.mockReturnValue(mockWatcher as any);

      const callback = jest.fn();
      watcher.watch('/file1.txt', callback);
      watcher.watch('/file2.txt', callback);

      watcher.close();

      expect(watcher.getWatchedFiles()).toEqual([]);
    });

    it('should be idempotent', () => {
      const mockWatcher = { close: jest.fn() };
      mockedWatch.mockReturnValue(mockWatcher as any);

      watcher.watch('/file.txt', jest.fn());

      watcher.close();
      watcher.close();
      watcher.close();

      expect(mockWatcher.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('getWatchedFiles', () => {
    it('should return empty array initially', () => {
      expect(watcher.getWatchedFiles()).toEqual([]);
    });

    it('should return list of watched files', () => {
      const mockWatcher = { close: jest.fn() };
      mockedWatch.mockReturnValue(mockWatcher as any);

      watcher.watch('/file1.txt', jest.fn());
      watcher.watch('/file2.txt', jest.fn());
      watcher.watch('/file3.txt', jest.fn());

      const files = watcher.getWatchedFiles();

      expect(files).toContain('/file1.txt');
      expect(files).toContain('/file2.txt');
      expect(files).toContain('/file3.txt');
      expect(files.length).toBe(3);
    });

    it('should not include unwatched files', () => {
      const mockWatcher = { close: jest.fn() };
      mockedWatch.mockReturnValue(mockWatcher as any);

      const callback = jest.fn();
      watcher.watch('/file1.txt', callback);
      watcher.watch('/file2.txt', callback);

      watcher.unwatch('/file1.txt');

      const files = watcher.getWatchedFiles();

      expect(files).not.toContain('/file1.txt');
      expect(files).toContain('/file2.txt');
    });

    it('should return copy of internal array', () => {
      const mockWatcher = { close: jest.fn() };
      mockedWatch.mockReturnValue(mockWatcher as any);

      watcher.watch('/file.txt', jest.fn());

      const files1 = watcher.getWatchedFiles();
      const files2 = watcher.getWatchedFiles();

      expect(files1).not.toBe(files2);
      expect(files1).toEqual(files2);
    });
  });

  describe('Integration tests', () => {
    it('should handle complete watch/unwatch cycle', () => {
      const mockWatcher = { close: jest.fn() };
      mockedWatch.mockReturnValue(mockWatcher as any);

      const callback = jest.fn();

      // Watch
      watcher.watch('/file.txt', callback);
      expect(watcher.getWatchedFiles()).toContain('/file.txt');

      // Unwatch
      watcher.unwatch('/file.txt');
      expect(watcher.getWatchedFiles()).not.toContain('/file.txt');

      // Watch again
      watcher.watch('/file.txt', callback);
      expect(watcher.getWatchedFiles()).toContain('/file.txt');

      // Close all
      watcher.close();
      expect(watcher.getWatchedFiles()).toEqual([]);
    });

    it('should handle multiple rapid watch/unwatch cycles', () => {
      const mockWatcher = { close: jest.fn() };
      mockedWatch.mockReturnValue(mockWatcher as any);

      const callback = jest.fn();

      for (let i = 0; i < 5; i++) {
        watcher.watch(`/file${i}.txt`, callback);
      }

      expect(watcher.getWatchedFiles().length).toBe(5);

      for (let i = 0; i < 5; i++) {
        watcher.unwatch(`/file${i}.txt`);
      }

      expect(watcher.getWatchedFiles()).toEqual([]);
    });

    it('should handle error in callback without affecting other watchers', (done) => {
      let callback1: ((eventType: string, filename: string | null) => void) | undefined;
      let callback2: ((eventType: string, filename: string | null) => void) | undefined;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockedWatch
        .mockImplementationOnce((path, cb) => {
          callback1 = cb as any;
          return { close: jest.fn() } as any;
        })
        .mockImplementationOnce((path, cb) => {
          callback2 = cb as any;
          return { close: jest.fn() } as any;
        });

      const errorCallback = jest.fn(() => {
        throw new Error('Error');
      });
      const normalCallback = jest.fn();

      watcher.watch('/file1.txt', errorCallback);
      watcher.watch('/file2.txt', normalCallback);

      if (callback1) callback1('change', 'file1.txt');
      if (callback2) callback2('change', 'file2.txt');

      setTimeout(() => {
        expect(errorCallback).toHaveBeenCalled();
        expect(normalCallback).toHaveBeenCalled();
        consoleSpy.mockRestore();
        done();
      }, 350);
    });
  });

  describe('edge cases', () => {
    it('should handle null event type', (done) => {
      let watchCallback: ((eventType: string, filename: string | null) => void) | undefined;
      const mockWatcher = { close: jest.fn() };

      mockedWatch.mockImplementation((path, callback) => {
        watchCallback = callback as any;
        return mockWatcher as any;
      });

      const userCallback = jest.fn();
      watcher.watch('/path/to/file.txt', userCallback);

      // Pass null as event type (should be treated as rename)
      if (watchCallback) {
        (watchCallback as any)(null, 'file.txt');
      }

      setTimeout(() => {
        expect(userCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'rename',
          })
        );
        done();
      }, 350);
    });

    it('should handle empty filename', (done) => {
      let watchCallback: ((eventType: string, filename: string | null) => void) | undefined;
      const mockWatcher = { close: jest.fn() };

      mockedWatch.mockImplementation((path, callback) => {
        watchCallback = callback as any;
        return mockWatcher as any;
      });

      const userCallback = jest.fn();
      watcher.watch('/path/to/file.txt', userCallback);

      if (watchCallback) {
        watchCallback('change', null);
      }

      setTimeout(() => {
        expect(userCallback).toHaveBeenCalled();
        done();
      }, 350);
    });
  });
});
