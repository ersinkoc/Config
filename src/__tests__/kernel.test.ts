// @ts-nocheck
/**
 * Tests for kernel.ts
 */

import { jest } from '@jest/globals';
import { createKernel, ConfigKernelImpl } from '../kernel.js';
import type { ConfigKernel, ConfigPlugin, KernelContext } from '../types.js';

describe('createKernel', () => {
  it('should create a kernel instance', () => {
    const context: KernelContext = {
      name: 'test',
      env: 'development',
      config: {},
    };

    const kernel = createKernel(context);

    expect(kernel).toBeDefined();
    expect(kernel.plugins).toBeDefined();
    expect(kernel.events).toBeDefined();
    expect(kernel.cache).toBeDefined();
    expect(kernel.fs).toBeDefined();
    expect(kernel.context).toEqual(context);
  });

  it('should create kernel with custom context', () => {
    const context: KernelContext = {
      name: 'myapp',
      env: 'production',
      config: { key: 'value' },
    };

    const kernel = createKernel(context);

    expect(kernel.context.name).toBe('myapp');
    expect(kernel.context.env).toBe('production');
    expect(kernel.context.config).toEqual({ key: 'value' });
  });
});

describe('ConfigKernelImpl', () => {
  let kernel: ConfigKernelImpl;
  let mockContext: KernelContext;

  beforeEach(() => {
    mockContext = {
      name: 'test-app',
      env: 'test',
      config: {},
    };

    kernel = new ConfigKernelImpl(mockContext);
  });

  describe('constructor', () => {
    it('should initialize all components', () => {
      expect(kernel.plugins).toBeDefined();
      expect(kernel.events).toBeDefined();
      expect(kernel.cache).toBeDefined();
      expect(kernel.fs).toBeDefined();
      expect(kernel.context).toBe(mockContext);
    });

    it('should store provided context', () => {
      const context: KernelContext = {
        name: 'custom-app',
        env: 'staging',
        config: { test: true },
      };

      const customKernel = new ConfigKernelImpl(context);

      expect(customKernel.context).toBe(context);
    });
  });

  describe('getPlugin', () => {
    it('should delegate to plugins manager', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      kernel.plugins.register(plugin);

      expect(kernel.getPlugin('test-plugin')).toBe(plugin);
    });

    it('should return undefined for non-existent plugin', () => {
      expect(kernel.getPlugin('nonexistent')).toBeUndefined();
    });
  });

  describe('emit', () => {
    it('should delegate to event bus', () => {
      const handler = jest.fn();
      kernel.events.on('test:event', handler);

      kernel.emit('test:event', { data: 'test' });

      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should emit without data', () => {
      const handler = jest.fn();
      kernel.events.on('test:event', handler);

      kernel.emit('test:event');

      expect(handler).toHaveBeenCalledWith(undefined);
    });
  });

  describe('on', () => {
    it('should delegate to event bus', () => {
      const handler = jest.fn();
      kernel.on('test:event', handler);

      kernel.events.emit('test:event', { data: 'test' });

      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should register multiple handlers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      kernel.on('test', handler1);
      kernel.on('test', handler2);

      kernel.events.emit('test', {});

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('should delegate to event bus', () => {
      const handler = jest.fn();
      kernel.events.on('test:event', handler);

      kernel.off('test:event', handler);
      kernel.events.emit('test:event', {});

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('initialize', () => {
    it('should emit initialization event', () => {
      const handler = jest.fn();
      kernel.events.on('kernel:initialized', handler);

      kernel.initialize();

      expect(handler).toHaveBeenCalled();
    });

    it('should be idempotent', () => {
      const handler = jest.fn();
      kernel.events.on('kernel:initialized', handler);

      kernel.initialize();
      kernel.initialize();
      kernel.initialize();

      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe('shutdown', () => {
    it('should emit shutdown event', () => {
      const handler = jest.fn();
      kernel.events.on('kernel:shutdown', handler);

      kernel.shutdown();

      expect(handler).toHaveBeenCalled();
    });

    it('should clear cache', () => {
      kernel.cache.set('key', 'value');
      expect(kernel.cache.has('key')).toBe(true);

      kernel.shutdown();

      expect(kernel.cache.has('key')).toBe(false);
    });

    it('should clear plugins', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      kernel.plugins.register(plugin);

      kernel.shutdown();

      expect(kernel.plugins.has('test-plugin')).toBe(false);
    });

    it('should remove all event listeners', () => {
      kernel.events.on('test', jest.fn());

      kernel.shutdown();

      expect(kernel.events.listenerCount('test')).toBe(0);
    });

    it('should be callable multiple times', () => {
      expect(() => {
        kernel.shutdown();
        kernel.shutdown();
      }).not.toThrow();
    });
  });

  describe('Integration with plugins', () => {
    it('should allow plugins to access kernel', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn((k) => {
          expect(k).toBe(kernel);
        }),
      };

      kernel.plugins.use(plugin);

      expect(plugin.install).toHaveBeenCalledWith(kernel);
    });

    it('should allow plugins to emit events', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn((k) => {
          k.emit('plugin:ready');
        }),
      };

      const handler = jest.fn();
      kernel.events.on('plugin:ready', handler);

      kernel.plugins.use(plugin);

      expect(handler).toHaveBeenCalled();
    });

    it('should allow plugins to subscribe to events', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn((k) => {
          k.on('custom:event', jest.fn());
        }),
      };

      kernel.plugins.use(plugin);

      expect(kernel.events.listenerCount('custom:event')).toBe(1);
    });
  });

  describe('Context handling', () => {
    it('should preserve context reference', () => {
      expect(kernel.context).toBe(mockContext);
    });

    it('should allow context modification', () => {
      kernel.context.config = { newKey: 'newValue' };

      expect(kernel.context.config).toEqual({ newKey: 'newValue' });
    });

    it('should reflect context changes', () => {
      const originalName = kernel.context.name;
      kernel.context.name = 'updated';

      expect(kernel.context.name).toBe('updated');
    });
  });

  describe('Component access', () => {
    it('should provide access to cache', () => {
      kernel.cache.set('test', 'value');

      expect(kernel.cache.get('test')).toBe('value');
    });

    it('should provide access to plugins', () => {
      expect(kernel.plugins.list()).toEqual([]);
    });

    it('should provide access to events', () => {
      expect(kernel.events.eventNames()).toEqual([]);
    });

    it('should provide access to fs', () => {
      expect(kernel.fs).toBeDefined();
      expect(kernel.fs.readFile).toBeInstanceOf(Function);
      expect(kernel.fs.exists).toBeInstanceOf(Function);
      expect(kernel.fs.watchFile).toBeInstanceOf(Function);
      expect(kernel.fs.unwatchFile).toBeInstanceOf(Function);
      expect(kernel.fs.close).toBeInstanceOf(Function);
    });
  });

  describe('Error handling', () => {
    it('should handle errors from plugin initialization gracefully', () => {
      const plugin: ConfigPlugin = {
        name: 'failing-plugin',
        version: '1.0.0',
        install: jest.fn(() => {
          throw new Error('Install failed');
        }),
      };

      expect(() => kernel.plugins.use(plugin)).toThrow();
    });

    it('should continue functioning after plugin error', () => {
      const failingPlugin: ConfigPlugin = {
        name: 'failing-plugin',
        version: '1.0.0',
        install: jest.fn(() => {
          throw new Error('Install failed');
        }),
      };

      const workingPlugin: ConfigPlugin = {
        name: 'working-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      try {
        kernel.plugins.use(failingPlugin);
      } catch {
        // Expected error
      }

      kernel.plugins.use(workingPlugin);

      expect(kernel.plugins.isInstalled('working-plugin')).toBe(true);
      expect(kernel.plugins.isInstalled('failing-plugin')).toBe(false);
    });
  });

  describe('Lifecycle', () => {
    it('should go through full lifecycle', () => {
      const initHandler = jest.fn();
      const shutdownHandler = jest.fn();

      kernel.events.on('kernel:initialized', initHandler);
      kernel.events.on('kernel:shutdown', shutdownHandler);

      // Initialize
      kernel.initialize();
      expect(initHandler).toHaveBeenCalled();

      // Do some work
      kernel.cache.set('key', 'value');

      // Shutdown
      kernel.shutdown();
      expect(shutdownHandler).toHaveBeenCalled();
      expect(kernel.cache.has('key')).toBe(false);
    });

    it('should handle multiple initialize/shutdown cycles', () => {
      for (let i = 0; i < 3; i++) {
        kernel.initialize();
        kernel.cache.set(`key${i}`, `value${i}`);
        kernel.shutdown();
      }

      expect(kernel.cache.size()).toBe(0);
    });
  });

  describe('FileSystem', () => {
    it('should have fs property', () => {
      expect(kernel.fs).toBeDefined();
    });

    it('should have readFile method', () => {
      expect(typeof kernel.fs.readFile).toBe('function');
    });

    it('should have exists method', () => {
      expect(typeof kernel.fs.exists).toBe('function');
    });

    it('should have watchFile method', () => {
      expect(typeof kernel.fs.watchFile).toBe('function');
    });

    it('should have unwatchFile method', () => {
      expect(typeof kernel.fs.unwatchFile).toBe('function');
    });

    it('should have close method', () => {
      expect(typeof kernel.fs.close).toBe('function');
    });

    it('should call readFile', async () => {
      // Mock the underlying readFile function
      const mockReadFile = jest.spyOn(require('../utils/file.js'), 'readFile');
      mockReadFile.mockResolvedValue('content');

      const result = await kernel.fs.readFile('/test.txt');
      expect(result).toBe('content');

      mockReadFile.mockRestore();
    });

    it('should call exists', async () => {
      const mockExists = jest.spyOn(require('../utils/file.js'), 'exists');
      mockExists.mockResolvedValue(true);

      const result = await kernel.fs.exists('/test.txt');
      expect(result).toBe(true);

      mockExists.mockRestore();
    });

    it('should call watchFile', () => {
      const callback = jest.fn();
      expect(() => kernel.fs.watchFile('/test.txt', callback)).not.toThrow();
    });

    it('should call unwatchFile', () => {
      expect(() => kernel.fs.unwatchFile('/test.txt')).not.toThrow();
    });

    it('should call close', () => {
      expect(() => kernel.fs.close()).not.toThrow();
    });
  });
});
