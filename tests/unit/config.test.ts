/**
 * Tests for ConfigImpl class.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConfigImpl, createConfigInstance } from '../../src/config.js';
import { ConfigNotFoundError, RequiredFieldError } from '../../src/errors.js';
import type { LoadOptions, ConfigPlugin } from '../../src/types.js';

// Mock file utilities
vi.mock('../../src/utils/file.js', () => ({
  findConfigFiles: vi.fn().mockReturnValue(['/test/config.json']),
  detectFormat: vi.fn().mockReturnValue('json'),
  readFile: vi.fn().mockResolvedValue('{}'),
  exists: vi.fn().mockResolvedValue(true),
  watchFile: vi.fn(),
}));

// Mock parser registry
vi.mock('../../src/parsers/index.js', () => ({
  parserRegistry: {
    detect: vi.fn().mockReturnValue({
      parse: (content: string) => JSON.parse(content || '{}'),
    }),
  },
}));

// Mock kernel watcher
vi.mock('../../src/kernel/watcher.js', () => ({
  ConfigFileWatcher: vi.fn().mockImplementation(() => ({
    watch: vi.fn(),
    unwatch: vi.fn(),
    close: vi.fn(),
    getWatchedFiles: vi.fn().mockReturnValue([]),
  })),
}));

describe('ConfigImpl', () => {
  let config: ConfigImpl;
  let options: LoadOptions;

  beforeEach(() => {
    vi.clearAllMocks();
    options = {
      name: 'test-config',
      cwd: '/test',
      env: 'development',
    };
    config = new ConfigImpl(options);
  });

  afterEach(() => {
    config.unwatch();
  });

  describe('constructor', () => {
    it('should create config instance with options', () => {
      expect(config).toBeInstanceOf(ConfigImpl);
    });

    it('should create kernel with context', () => {
      const kernel = config.getKernel();
      expect(kernel).toBeDefined();
      expect(kernel.context.name).toBe('test-config');
      expect(kernel.context.env).toBe('development');
    });

    it('should use development as default env', () => {
      const configNoEnv = new ConfigImpl({ name: 'test' });
      expect(configNoEnv.getKernel().context.env).toBe('development');
    });
  });

  describe('get', () => {
    it('should get value by path', async () => {
      await config.load();
      config.set('database.host', 'localhost');
      expect(config.get('database.host')).toBe('localhost');
    });

    it('should return default value if not found', async () => {
      await config.load();
      expect(config.get('nonexistent', 'default')).toBe('default');
    });

    it('should return undefined for non-existent path without default', async () => {
      await config.load();
      expect(config.get('nonexistent')).toBeUndefined();
    });

    it('should call plugin onGet hooks', async () => {
      const onGet = vi.fn((path, value) => value);
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: () => {},
        onGet,
      };

      config.use(plugin);
      await config.load();
      config.set('key', 'value');
      config.get('key');

      expect(onGet).toHaveBeenCalledWith('key', 'value');
    });

    it('should handle plugin onGet errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const plugin: ConfigPlugin = {
        name: 'error-plugin',
        version: '1.0.0',
        install: () => {},
        onGet: () => {
          throw new Error('onGet error');
        },
      };

      config.use(plugin);
      await config.load();
      config.set('key', 'value');

      expect(() => config.get('key')).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('set', () => {
    it('should set value by path', async () => {
      await config.load();
      config.set('database.port', 5432);
      expect(config.get('database.port')).toBe(5432);
    });

    it('should call plugin onSet hooks', async () => {
      const onSet = vi.fn((path, value) => value);
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: () => {},
        onSet,
      };

      config.use(plugin);
      await config.load();
      config.set('key', 'value');

      expect(onSet).toHaveBeenCalledWith('key', 'value');
    });

    it('should handle plugin onSet errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const plugin: ConfigPlugin = {
        name: 'error-plugin',
        version: '1.0.0',
        install: () => {},
        onSet: () => {
          throw new Error('onSet error');
        },
      };

      config.use(plugin);
      await config.load();

      expect(() => config.set('key', 'value')).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('has', () => {
    it('should return true for existing path', async () => {
      await config.load();
      config.set('database.host', 'localhost');
      expect(config.has('database.host')).toBe(true);
    });

    it('should return false for non-existent path', async () => {
      await config.load();
      expect(config.has('nonexistent')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete value at path', async () => {
      await config.load();
      config.set('key', 'value');
      expect(config.delete('key')).toBe(true);
      expect(config.has('key')).toBe(false);
    });

    it('should return false for non-existent path', async () => {
      await config.load();
      expect(config.delete('nonexistent')).toBe(false);
    });
  });

  describe('toObject', () => {
    it('should return deep clone of data', async () => {
      await config.load();
      config.set('key', 'value');

      const obj = config.toObject();
      expect(obj).toEqual({ key: 'value' });

      // Verify it's a clone
      (obj as any).key = 'modified';
      expect(config.get('key')).toBe('value');
    });
  });

  describe('toJSON', () => {
    it('should return JSON string', async () => {
      await config.load();
      config.set('key', 'value');

      const json = config.toJSON();
      expect(JSON.parse(json)).toEqual({ key: 'value' });
    });
  });

  describe('reload', () => {
    it('should reload config and emit reload event', async () => {
      const handler = vi.fn();
      config.on('reload', handler);

      await config.load();
      config.set('key', 'original');

      await config.reload();

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('on/off', () => {
    it('should register event handlers', async () => {
      const handler = vi.fn();
      config.on('reload', handler);

      await config.load();
      await config.reload();

      expect(handler).toHaveBeenCalled();
    });

    it('should remove event handlers', async () => {
      const handler = vi.fn();
      config.on('reload', handler);
      config.off('reload', handler);

      await config.load();
      await config.reload();

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle removing from non-existent event', () => {
      const handler = vi.fn();
      expect(() => config.off('nonexistent' as any, handler)).not.toThrow();
    });

    it('should remove event from map when last handler is removed', () => {
      const handler = vi.fn();
      config.on('change', handler);
      config.off('change', handler);
      // No error when emitting to empty event
    });
  });

  describe('watch/unwatch', () => {
    it('should start watching files', async () => {
      await config.load();
      const handler = vi.fn();
      config.on('watch:start', handler);

      config.watch();

      expect(handler).toHaveBeenCalled();
    });

    it('should not re-watch if already watching', async () => {
      const handler = vi.fn();
      config.on('watch:start', handler);

      await config.load();
      config.watch();
      config.watch();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should stop watching files', async () => {
      const handler = vi.fn();
      config.on('watch:stop', handler);

      await config.load();
      config.watch();
      config.unwatch();

      expect(handler).toHaveBeenCalled();
    });

    it('should not unwatch if not watching', async () => {
      const handler = vi.fn();
      config.on('watch:stop', handler);

      await config.load();
      config.unwatch();

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('use', () => {
    it('should register plugin', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
      };

      config.use(plugin);
      expect(config.plugins()).toContain('test-plugin');
    });
  });

  describe('plugins', () => {
    it('should return installed plugin names', () => {
      const plugin1: ConfigPlugin = {
        name: 'plugin1',
        version: '1.0.0',
        install: vi.fn(),
      };
      const plugin2: ConfigPlugin = {
        name: 'plugin2',
        version: '1.0.0',
        install: vi.fn(),
      };

      config.use(plugin1);
      config.use(plugin2);

      const plugins = config.plugins();
      expect(plugins).toContain('plugin1');
      expect(plugins).toContain('plugin2');
    });
  });

  describe('getKernel', () => {
    it('should return kernel instance', () => {
      const kernel = config.getKernel();
      expect(kernel).toBeDefined();
      expect(kernel.plugins).toBeDefined();
      expect(kernel.events).toBeDefined();
      expect(kernel.cache).toBeDefined();
    });
  });

  describe('load', () => {
    it('should load configuration files', async () => {
      const { findConfigFiles } = await import('../../src/utils/file.js');
      await config.load();

      expect(findConfigFiles).toHaveBeenCalled();
    });

    it('should throw ConfigNotFoundError when no files found', async () => {
      const { findConfigFiles } = await import('../../src/utils/file.js');
      (findConfigFiles as ReturnType<typeof vi.fn>).mockReturnValueOnce([]);

      await expect(config.load()).rejects.toThrow(ConfigNotFoundError);
    });

    it('should not throw when paths are provided', async () => {
      const { findConfigFiles, readFile } = await import('../../src/utils/file.js');
      (findConfigFiles as ReturnType<typeof vi.fn>).mockReturnValueOnce([]);
      (readFile as ReturnType<typeof vi.fn>).mockResolvedValueOnce('{"key": "value"}');

      const configWithPaths = new ConfigImpl({
        name: 'test',
        paths: ['/test/custom.json'],
      });

      await expect(configWithPaths.load()).resolves.not.toThrow();
    });

    it('should apply defaults', async () => {
      const configWithDefaults = new ConfigImpl({
        name: 'test',
        defaults: { defaultKey: 'defaultValue' },
        paths: ['/test/config.json'],
      });

      await configWithDefaults.load();
      expect(configWithDefaults.get('defaultKey')).toBe('defaultValue');
    });

    it('should validate required fields', async () => {
      const configWithRequired = new ConfigImpl({
        name: 'test',
        required: ['requiredField'],
        paths: ['/test/config.json'],
      });

      await expect(configWithRequired.load()).rejects.toThrow(RequiredFieldError);
    });

    it('should call onAfterMerge hooks', async () => {
      const onAfterMerge = vi.fn((data) => ({ ...data, merged: true }));
      const plugin: ConfigPlugin = {
        name: 'merge-plugin',
        version: '1.0.0',
        install: () => {},
        onAfterMerge,
      };

      config.use(plugin);
      await config.load();

      expect(onAfterMerge).toHaveBeenCalled();
      expect(config.get('merged')).toBe(true);
    });

    it('should handle onAfterMerge errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const plugin: ConfigPlugin = {
        name: 'error-plugin',
        version: '1.0.0',
        install: () => {},
        onAfterMerge: () => {
          throw new Error('merge error');
        },
      };

      config.use(plugin);
      await expect(config.load()).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should warn when no parser found for file', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { parserRegistry } = await import('../../src/parsers/index.js');
      (parserRegistry.detect as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);

      await config.load();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No parser found'));

      consoleSpy.mockRestore();
    });

    it('should skip missing files during load', async () => {
      const { readFile } = await import('../../src/utils/file.js');
      (readFile as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new ConfigNotFoundError('/test/missing.json')
      );

      await expect(config.load()).resolves.not.toThrow();
    });

    it('should log error for non-ConfigNotFoundError', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { readFile } = await import('../../src/utils/file.js');
      (readFile as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Read error'));

      await config.load();

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('handleFileChange', () => {
    it('should reload and emit change event on file change', async () => {
      const changeHandler = vi.fn();
      config.on('change', changeHandler);

      await config.load();
      config.watch();

      // Simulate file change by calling handleFileChange
      const event = {
        type: 'change' as const,
        path: '/test/config.json',
        timestamp: Date.now(),
      };

      // Access private method for testing
      await (config as any).handleFileChange(event);

      expect(changeHandler).toHaveBeenCalled();
    });

    it('should emit error event on reload failure', async () => {
      const errorHandler = vi.fn();
      config.on('error', errorHandler);

      await config.load();

      // Mock reload to throw
      const originalLoad = config.load.bind(config);
      config.load = vi.fn().mockRejectedValueOnce(new Error('Reload failed'));

      const event = {
        type: 'change' as const,
        path: '/test/config.json',
        timestamp: Date.now(),
      };

      await (config as any).handleFileChange(event);

      expect(errorHandler).toHaveBeenCalled();

      // Restore
      config.load = originalLoad;
    });
  });

  describe('emit (private)', () => {
    it('should handle errors in event handlers', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const errorHandler = () => {
        throw new Error('Handler error');
      };
      config.on('reload', errorHandler);

      await config.load();

      // This should not throw
      await expect(config.reload()).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});

describe('createConfigInstance', () => {
  it('should create ConfigImpl instance', () => {
    const config = createConfigInstance({ name: 'test' });
    expect(config).toBeInstanceOf(ConfigImpl);
  });
});
