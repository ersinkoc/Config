/**
 * Tests for ConfigKernelImpl implementation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigKernelImpl, createKernel } from '../../src/kernel.js';
import { PluginManager } from '../../src/kernel/plugins.js';
import { EventBus } from '../../src/kernel/events.js';
import { LRUCache } from '../../src/kernel/cache.js';
import type { KernelContext, ConfigPlugin } from '../../src/types.js';

// Mock file utils
vi.mock('../../src/utils/file.js', () => ({
  readFile: vi.fn().mockResolvedValue('file content'),
  exists: vi.fn().mockResolvedValue(true),
}));

// Mock watcher
vi.mock('../../src/kernel/watcher.js', () => ({
  ConfigFileWatcher: vi.fn().mockImplementation(() => ({
    watch: vi.fn(),
    unwatch: vi.fn(),
    close: vi.fn(),
  })),
}));

describe('ConfigKernelImpl', () => {
  let kernel: ConfigKernelImpl;
  let context: KernelContext;

  beforeEach(() => {
    context = { env: 'test', basePath: '/test' };
    kernel = new ConfigKernelImpl(context);
  });

  describe('constructor', () => {
    it('should initialize with context', () => {
      expect(kernel.context).toBe(context);
    });

    it('should create plugins manager', () => {
      expect(kernel.plugins).toBeInstanceOf(PluginManager);
    });

    it('should create events bus', () => {
      expect(kernel.events).toBeInstanceOf(EventBus);
    });

    it('should create cache', () => {
      expect(kernel.cache).toBeInstanceOf(LRUCache);
    });

    it('should create file system abstraction', () => {
      expect(kernel.fs).toBeDefined();
      expect(kernel.fs.readFile).toBeDefined();
      expect(kernel.fs.exists).toBeDefined();
      expect(kernel.fs.watchFile).toBeDefined();
      expect(kernel.fs.unwatchFile).toBeDefined();
    });
  });

  describe('getPlugin', () => {
    it('should return plugin from manager', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
      };
      kernel.plugins.use(plugin);

      expect(kernel.getPlugin('test-plugin')).toBe(plugin);
    });

    it('should return undefined for non-existent plugin', () => {
      expect(kernel.getPlugin('nonexistent')).toBeUndefined();
    });
  });

  describe('emit', () => {
    it('should emit events through event bus', () => {
      const handler = vi.fn();
      kernel.events.on('test', handler);

      kernel.emit('test', { data: 'value' });

      expect(handler).toHaveBeenCalledWith({ data: 'value' });
    });
  });

  describe('on', () => {
    it('should subscribe to events', () => {
      const handler = vi.fn();
      kernel.on('test', handler);

      kernel.emit('test', 'data');

      expect(handler).toHaveBeenCalledWith('data');
    });
  });

  describe('off', () => {
    it('should unsubscribe from events', () => {
      const handler = vi.fn();
      kernel.on('test', handler);
      kernel.off('test', handler);

      kernel.emit('test', 'data');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('initialize', () => {
    it('should emit kernel:initialized event', () => {
      const handler = vi.fn();
      kernel.on('kernel:initialized', handler);

      kernel.initialize();

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    it('should emit kernel:shutdown event', () => {
      const handler = vi.fn();
      kernel.on('kernel:shutdown', handler);

      kernel.shutdown();

      expect(handler).toHaveBeenCalled();
    });

    it('should clear cache', () => {
      kernel.cache.set('key', 'value');
      kernel.shutdown();
      expect(kernel.cache.size()).toBe(0);
    });

    it('should clear plugins', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
      };
      kernel.plugins.use(plugin);

      kernel.shutdown();

      expect(kernel.plugins.list()).toEqual([]);
    });

    it('should remove all event listeners', () => {
      kernel.on('test', vi.fn());
      kernel.shutdown();
      expect(kernel.events.eventNames()).toEqual([]);
    });
  });
});

describe('FileSystemImpl', () => {
  let kernel: ConfigKernelImpl;

  beforeEach(() => {
    kernel = new ConfigKernelImpl({ env: 'test' });
  });

  describe('readFile', () => {
    it('should read file content', async () => {
      const content = await kernel.fs.readFile('/test/file.txt');
      expect(content).toBe('file content');
    });
  });

  describe('exists', () => {
    it('should check file existence', async () => {
      const result = await kernel.fs.exists('/test/file.txt');
      expect(result).toBe(true);
    });
  });

  describe('watchFile', () => {
    it('should watch a file', () => {
      const callback = vi.fn();
      expect(() => kernel.fs.watchFile('/test/file.txt', callback)).not.toThrow();
    });
  });

  describe('unwatchFile', () => {
    it('should unwatch a file', () => {
      expect(() => kernel.fs.unwatchFile('/test/file.txt')).not.toThrow();
    });
  });

  describe('close', () => {
    it('should close all watchers', () => {
      expect(() => kernel.fs.close()).not.toThrow();
    });
  });
});

describe('createKernel', () => {
  it('should create ConfigKernelImpl instance', () => {
    const context: KernelContext = { env: 'production' };
    const kernel = createKernel(context);

    expect(kernel).toBeInstanceOf(ConfigKernelImpl);
    expect(kernel.context).toBe(context);
  });
});
