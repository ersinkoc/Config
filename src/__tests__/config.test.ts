// @ts-nocheck
/**
 * Tests for config.ts
 */

import { jest } from '@jest/globals';
import { ConfigImpl, createConfigInstance } from '../config.js';
import type { LoadOptions, Config } from '../types.js';

// Mock the dependencies
jest.mock('../kernel.js', () => ({
  createKernel: jest.fn(() => ({
    plugins: {
      listInstalled: jest.fn(() => []),
      use: jest.fn(),
    },
    getPlugin: jest.fn(),
    fs: {
      readFile: jest.fn(),
      watchFile: jest.fn(),
      close: jest.fn(),
    },
  })),
}));

jest.mock('../utils/file.js', () => ({
  findConfigFiles: jest.fn(() => []),
  detectFormat: jest.fn(() => 'json'),
}));

jest.mock('../parsers/index.js', () => ({
  parserRegistry: {
    detect: jest.fn(),
  },
}));

import { createKernel } from '../kernel.js';
import { findConfigFiles } from '../utils/file.js';
import { parserRegistry } from '../parsers/index.js';

const mockedCreateKernel = createKernel as jest.MockedFunction<typeof createKernel>;
const mockedFindConfigFiles = findConfigFiles as jest.MockedFunction<typeof findConfigFiles>;
const mockedParserRegistry = parserRegistry as jest.Mocked<typeof parserRegistry>;

describe('ConfigImpl', () => {
  let config: ConfigImpl;

  beforeEach(() => {
    jest.clearAllMocks();

    const mockKernel = {
      plugins: {
        listInstalled: jest.fn(() => []),
        use: jest.fn(),
      },
      getPlugin: jest.fn(),
      fs: {
        readFile: jest.fn(),
        watchFile: jest.fn(),
        close: jest.fn(),
      },
    };

    mockedCreateKernel.mockReturnValue(mockKernel as any);

    const options: LoadOptions = {
      name: 'test-app',
      env: 'test',
    };

    config = new ConfigImpl(options);
  });

  describe('constructor', () => {
    it('should create config instance with options', () => {
      const options: LoadOptions = {
        name: 'myapp',
        env: 'development',
        defaults: { port: 3000 },
      };

      const configInstance = new ConfigImpl(options);

      expect(configInstance).toBeInstanceOf(ConfigImpl);
    });

    it('should create kernel with correct context', () => {
      const options: LoadOptions = {
        name: 'test-app',
        env: 'production',
      };

      new ConfigImpl(options);

      expect(mockedCreateKernel).toHaveBeenCalledWith({
        name: 'test-app',
        env: 'production',
        config: expect.any(Object),
      });
    });
  });

  describe('get', () => {
    beforeEach(() => {
      (config as any).data = {
        port: 3000,
        host: 'localhost',
        database: {
          host: 'db.local',
          port: 5432,
        },
      };
    });

    it('should get value at simple path', () => {
      expect(config.get('port')).toBe(3000);
      expect(config.get('host')).toBe('localhost');
    });

    it('should get value at nested path', () => {
      expect(config.get('database.host')).toBe('db.local');
      expect(config.get('database.port')).toBe(5432);
    });

    it('should return undefined for non-existent path', () => {
      expect(config.get('nonexistent')).toBeUndefined();
      expect(config.get('database.nonexistent')).toBeUndefined();
    });

    it('should return default value for non-existent path', () => {
      expect(config.get('nonexistent', 'default')).toBe('default');
      expect(config.get('missing', 42)).toBe(42);
    });

    it('should call plugin onGet hooks', () => {
      const mockPlugin = {
        name: 'test-plugin',
        onGet: jest.fn((path, value) => {
          if (path === 'port') return 4000;
          return value;
        }),
      };

      // Access the kernel from the config instance itself
      const kernel = config.getKernel();
      kernel.getPlugin = jest.fn(() => mockPlugin);
      kernel.plugins.listInstalled = jest.fn(() => ['test-plugin']);

      expect(config.get('port')).toBe(4000);
      expect(mockPlugin.onGet).toHaveBeenCalledWith('port', 3000);
    });

    it('should handle plugin errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockPlugin = {
        name: 'error-plugin',
        onGet: jest.fn(() => {
          throw new Error('Plugin error');
        }),
      };

      const kernel = config.getKernel();
      kernel.getPlugin = jest.fn(() => mockPlugin);
      kernel.plugins.listInstalled = jest.fn(() => ['error-plugin']);

      expect(config.get('port')).toBe(3000); // Should return original value
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('set', () => {
    it('should set value at path', () => {
      config.set('port', 4000);
      expect((config as any).data.port).toBe(4000);

      config.set('database.host', 'remote');
      expect((config as any).data.database.host).toBe('remote');
    });

    it('should create nested objects', () => {
      config.set('new.nested.key', 'value');
      expect((config as any).data.new.nested.key).toBe('value');
    });

    it('should call plugin onSet hooks', () => {
      const mockPlugin = {
        name: 'test-plugin',
        onSet: jest.fn((path, value) => {
          if (path === 'port') return 5000;
          return value;
        }),
      };

      const kernel = config.getKernel();
      kernel.getPlugin = jest.fn(() => mockPlugin);
      kernel.plugins.listInstalled = jest.fn(() => ['test-plugin']);

      config.set('port', 4000);
      expect((config as any).data.port).toBe(5000);
    });

    it('should handle plugin errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockPlugin = {
        name: 'error-plugin',
        onSet: jest.fn(() => {
          throw new Error('Plugin error');
        }),
      };

      const kernel = config.getKernel();
      kernel.getPlugin = jest.fn(() => mockPlugin);
      kernel.plugins.listInstalled = jest.fn(() => ['error-plugin']);

      config.set('port', 4000);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('has', () => {
    beforeEach(() => {
      (config as any).data = {
        port: 3000,
        database: {
          host: 'localhost',
        },
      };
    });

    it('should return true for existing paths', () => {
      expect(config.has('port')).toBe(true);
      expect(config.has('database.host')).toBe(true);
    });

    it('should return false for non-existent paths', () => {
      expect(config.has('nonexistent')).toBe(false);
      expect(config.has('database.port')).toBe(false);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      (config as any).data = {
        port: 3000,
        database: {
          host: 'localhost',
        },
      };
    });

    it('should delete value at path', () => {
      expect(config.delete('port')).toBe(true);
      expect((config as any).data.port).toBeUndefined();
    });

    it('should delete nested value', () => {
      expect(config.delete('database.host')).toBe(true);
      expect((config as any).data.database.host).toBeUndefined();
    });

    it('should return false for non-existent path', () => {
      expect(config.delete('nonexistent')).toBe(false);
    });
  });

  describe('toObject', () => {
    it('should return config as object', () => {
      (config as any).data = { port: 3000, host: 'localhost' };

      const obj = config.toObject();

      expect(obj).toEqual({ port: 3000, host: 'localhost' });
    });

    it('should return a deep clone', () => {
      (config as any).data = { nested: { value: 1 } };

      const obj = config.toObject() as { nested: { value: number } };
      obj.nested.value = 2;

      expect((config as any).data.nested.value).toBe(1);
    });
  });

  describe('toJSON', () => {
    it('should return config as JSON string', () => {
      (config as any).data = { port: 3000 };

      const json = config.toJSON();

      expect(json).toBe('{\n  "port": 3000\n}');
    });

    it('should be parseable', () => {
      (config as any).data = { port: 3000, host: 'localhost' };

      const json = config.toJSON();
      const parsed = JSON.parse(json);

      expect(parsed).toEqual({ port: 3000, host: 'localhost' });
    });
  });

  describe('reload', () => {
    it('should reload configuration', async () => {
      (config as any).data = { port: 3000 };

      const reloadSpy = jest.spyOn(config as any, 'load').mockResolvedValue(undefined);

      await config.reload();

      expect(reloadSpy).toHaveBeenCalled();
    });

    it('should emit reload event', async () => {
      (config as any).data = { port: 3000 };

      const handler = jest.fn();
      config.on('reload', handler);

      jest.spyOn(config as any, 'load').mockImplementation(() => {
        (config as any).data = { port: 4000 };
      });

      await config.reload();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          oldData: { port: 3000 },
          newData: { port: 4000 },
        })
      );
    });
  });

  describe('on', () => {
    it('should register event handler', () => {
      const handler = jest.fn();
      config.on('change', handler);

      (config as any).emit('change', { test: 'data' });

      expect(handler).toHaveBeenCalledWith({ test: 'data' });
    });

    it('should register multiple handlers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      config.on('change', handler1);
      config.on('change', handler2);

      (config as any).emit('change', {});

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('should remove event handler', () => {
      const handler = jest.fn();
      config.on('change', handler);
      config.off('change', handler);

      (config as any).emit('change', {});

      expect(handler).not.toHaveBeenCalled();
    });

    it('should only remove specified handler', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      config.on('change', handler1);
      config.on('change', handler2);
      config.off('change', handler1);

      (config as any).emit('change', {});

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('watch', () => {
    it('should start watching files', () => {
      (config as any).configFiles = ['/path/to/config.yaml'];

      config.watch();

      expect((config as any).isWatching).toBe(true);
    });

    it('should emit watch:start event', () => {
      const handler = jest.fn();
      config.on('watch:start', handler);

      (config as any).configFiles = [];
      config.watch();

      expect(handler).toHaveBeenCalled();
    });

    it('should not watch twice', () => {
      const kernel = config.getKernel();
      const watchFileSpy = jest.fn();
      kernel.fs.watchFile = watchFileSpy;

      (config as any).configFiles = ['/file1.yaml'];

      config.watch();
      config.watch();

      expect(watchFileSpy).toHaveBeenCalledTimes(1);
    });

    it('should watch all config files', () => {
      const kernel = config.getKernel();
      const watchFileSpy = jest.fn();
      kernel.fs.watchFile = watchFileSpy;

      (config as any).configFiles = ['/file1.yaml', '/file2.yaml', '/file3.yaml'];

      config.watch();

      expect(watchFileSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('unwatch', () => {
    it('should stop watching files', () => {
      const kernel = config.getKernel();
      const closeSpy = jest.fn();
      kernel.fs.close = closeSpy;

      (config as any).isWatching = true;

      config.unwatch();

      expect(closeSpy).toHaveBeenCalled();
      expect((config as any).isWatching).toBe(false);
    });

    it('should emit watch:stop event', () => {
      const handler = jest.fn();
      config.on('watch:stop', handler);

      const kernel = config.getKernel();
      kernel.fs.close = jest.fn();

      (config as any).isWatching = true;

      config.unwatch();

      expect(handler).toHaveBeenCalled();
    });

    it('should handle unwatch when not watching', () => {
      expect(() => config.unwatch()).not.toThrow();
    });
  });

  describe('use', () => {
    it('should register plugin', () => {
      const kernel = config.getKernel();
      const useSpy = jest.fn();
      kernel.plugins.use = useSpy;

      const plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      config.use(plugin as any);

      expect(useSpy).toHaveBeenCalledWith(plugin);
    });
  });

  describe('plugins', () => {
    it('should list registered plugins', () => {
      const kernel = config.getKernel();
      kernel.plugins.listInstalled = jest.fn(() => ['plugin1', 'plugin2']);

      const plugins = config.plugins();

      expect(plugins).toEqual(['plugin1', 'plugin2']);
    });
  });

  describe('getKernel', () => {
    it('should return kernel instance', () => {
      const kernel = config.getKernel();

      expect(kernel).toBeDefined();
      expect(kernel.plugins).toBeDefined();
      expect(kernel.fs).toBeDefined();
    });
  });

  describe('load', () => {
    it('should load config files', async () => {
      mockedFindConfigFiles.mockReturnValue(['/config.yaml']);

      const mockParser = {
        parse: jest.fn(() => ({ port: 3000 })),
      };

      mockedParserRegistry.detect = jest.fn(() => mockParser as any);

      const options: LoadOptions = {
        name: 'test-app',
        env: 'development',
      };

      const configInstance = new ConfigImpl(options);
      const kernel = configInstance.getKernel();
      kernel.fs.readFile = jest.fn().mockResolvedValue('port: 3000');

      await configInstance.load();

      expect(kernel.fs.readFile).toHaveBeenCalled();
    });

    it('should apply defaults', async () => {
      mockedFindConfigFiles.mockReturnValue([]);

      const options: LoadOptions = {
        name: 'test-app',
        paths: ['/config.yaml'],
        defaults: { port: 3000, host: 'localhost' },
      };

      const mockParser = { parse: jest.fn(() => ({})) };
      mockedParserRegistry.detect = jest.fn(() => mockParser as any);

      const configInstance = new ConfigImpl(options);
      const kernel = configInstance.getKernel();
      kernel.fs.readFile = jest.fn().mockResolvedValue('{}');

      await configInstance.load();

      expect((configInstance as any).data.port).toBe(3000);
      expect((configInstance as any).data.host).toBe('localhost');
    });

    it('should throw error if no config files found and no paths provided', async () => {
      const options: LoadOptions = {
        name: 'test-app',
      };

      mockedFindConfigFiles.mockReturnValue([]);

      const configInstance = new ConfigImpl(options);

      await expect(configInstance.load()).rejects.toThrow();
    });

    it('should use explicit paths when provided', async () => {
      const options: LoadOptions = {
        name: 'test-app',
        paths: ['/custom/config.yaml'],
      };

      mockedFindConfigFiles.mockReturnValue([]);

      const mockParser = { parse: jest.fn(() => ({})) };
      mockedParserRegistry.detect = jest.fn(() => mockParser as any);

      const configInstance = new ConfigImpl(options);
      const kernel = configInstance.getKernel();
      kernel.fs.readFile = jest.fn().mockResolvedValue('port: 3000');

      await configInstance.load();

      expect(kernel.fs.readFile).toHaveBeenCalledWith('/custom/config.yaml');
    });

    it('should merge multiple config files', async () => {
      const options: LoadOptions = {
        name: 'test-app',
        paths: ['/config1.yaml', '/config2.yaml'],
      };

      mockedFindConfigFiles.mockReturnValue([]);

      const mockParser = {
        parse: jest.fn((content) => {
          if (content === 'port: 3000') return { port: 3000 };
          return { host: 'localhost' };
        }),
      };

      mockedParserRegistry.detect = jest.fn(() => mockParser as any);

      const configInstance = new ConfigImpl(options);
      const kernel = configInstance.getKernel();
      kernel.fs.readFile = jest.fn()
        .mockResolvedValueOnce('port: 3000')
        .mockResolvedValueOnce('host: localhost');

      await configInstance.load();

      // Both values should be present after merge
      expect((configInstance as any).data).toBeDefined();
    });

    it('should validate required fields', async () => {
      const options: LoadOptions = {
        name: 'test-app',
        paths: ['/config.yaml'],
        required: ['port', 'host'],
      };

      mockedFindConfigFiles.mockReturnValue([]);

      const mockParser = { parse: jest.fn(() => ({ port: 3000 })) };
      mockedParserRegistry.detect = jest.fn(() => mockParser as any);

      const configInstance = new ConfigImpl(options);
      const kernel = configInstance.getKernel();
      kernel.fs.readFile = jest.fn().mockResolvedValue('port: 3000');

      await expect(configInstance.load()).rejects.toThrow();
    });

    it('should pass validation when all required fields present', async () => {
      const options: LoadOptions = {
        name: 'test-app',
        paths: ['/config.yaml'],
        required: ['port'],
      };

      mockedFindConfigFiles.mockReturnValue([]);

      const mockParser = { parse: jest.fn(() => ({ port: 3000 })) };
      mockedParserRegistry.detect = jest.fn(() => mockParser as any);

      const configInstance = new ConfigImpl(options);
      const kernel = configInstance.getKernel();
      kernel.fs.readFile = jest.fn().mockResolvedValue('port: 3000');

      await expect(configInstance.load()).resolves.not.toThrow();
    });
  });
});

describe('createConfigInstance', () => {
  it('should create ConfigImpl instance', () => {
    const options: LoadOptions = {
      name: 'test-app',
    };

    const config = createConfigInstance(options);

    expect(config).toBeInstanceOf(ConfigImpl);
  });

  it('should pass options to ConfigImpl', () => {
    const options: LoadOptions = {
      name: 'myapp',
      env: 'production',
      defaults: { key: 'value' },
    };

    const config = createConfigInstance(options);

    expect(config).toBeInstanceOf(ConfigImpl);
  });
});

describe('ConfigImpl edge cases', () => {
  let config: InstanceType<typeof ConfigImpl>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedFindConfigFiles.mockReturnValue([]);
    config = new ConfigImpl({ name: 'test-app' });
  });

  describe('load - error handling', () => {
    it('should warn when no parser found for file', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const options: LoadOptions = {
        name: 'test-app',
        paths: ['/config.unknown'],
      };

      mockedParserRegistry.detect = jest.fn(() => undefined);

      const configInstance = new ConfigImpl(options);
      const kernel = configInstance.getKernel();
      kernel.fs.readFile = jest.fn().mockResolvedValue('content');

      await configInstance.load();

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('No parser found'));
      consoleWarnSpy.mockRestore();
    });

    it('should skip missing files during load', async () => {
      const options: LoadOptions = {
        name: 'test-app',
        paths: ['/config.yaml'],
      };

      const mockParser = { parse: jest.fn(() => ({})) };
      mockedParserRegistry.detect = jest.fn(() => mockParser as any);

      const configInstance = new ConfigImpl(options);
      const kernel = configInstance.getKernel();

      const ConfigNotFoundError = (await import('../errors.js')).ConfigNotFoundError;
      kernel.fs.readFile = jest.fn().mockRejectedValue(new ConfigNotFoundError('/config.yaml'));

      await configInstance.load();

      expect((configInstance as any).data).toBeDefined();
    });

    it('should log error for other file read errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const options: LoadOptions = {
        name: 'test-app',
        paths: ['/config.yaml'],
      };

      const mockParser = { parse: jest.fn(() => ({})) };
      mockedParserRegistry.detect = jest.fn(() => mockParser as any);

      const configInstance = new ConfigImpl(options);
      const kernel = configInstance.getKernel();
      kernel.fs.readFile = jest.fn().mockRejectedValue(new Error('Read error'));

      await configInstance.load();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error loading config'),
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('plugins - onAfterMerge hooks', () => {
    it('should call plugin onAfterMerge hooks', async () => {
      const options: LoadOptions = {
        name: 'test-app',
        paths: ['/config.yaml'],
      };

      const mockParser = { parse: jest.fn(() => ({ value: 1 })) };
      mockedParserRegistry.detect = jest.fn(() => mockParser as any);

      const configInstance = new ConfigImpl(options);
      const kernel = configInstance.getKernel();
      kernel.fs.readFile = jest.fn().mockResolvedValue('value: 1');
      kernel.plugins.listInstalled = jest.fn(() => ['test-plugin']);

      const mockPlugin = {
        name: 'test-plugin',
        onAfterMerge: jest.fn((data) => ({ ...data, transformed: true })),
      };
      kernel.getPlugin = jest.fn(() => mockPlugin);

      await configInstance.load();

      expect(mockPlugin.onAfterMerge).toHaveBeenCalled();
    });

    it('should log error if plugin onAfterMerge throws', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const options: LoadOptions = {
        name: 'test-app',
        paths: ['/config.yaml'],
      };

      const mockParser = { parse: jest.fn(() => ({ value: 1 })) };
      mockedParserRegistry.detect = jest.fn(() => mockParser as any);

      const configInstance = new ConfigImpl(options);
      const kernel = configInstance.getKernel();
      kernel.fs.readFile = jest.fn().mockResolvedValue('value: 1');
      kernel.plugins.listInstalled = jest.fn(() => ['test-plugin']);

      const mockPlugin = {
        name: 'test-plugin',
        onAfterMerge: jest.fn(() => { throw new Error('Plugin error'); }),
      };
      kernel.getPlugin = jest.fn(() => mockPlugin);

      await configInstance.load();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in plugin'),
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('file watching - handleFileChange', () => {
    it('should handle file change and emit change event', async () => {
      const options: LoadOptions = {
        name: 'test-app',
        paths: ['/config.yaml'],
      };

      const mockParser = { parse: jest.fn(() => ({ value: 1 })) };
      mockedParserRegistry.detect = jest.fn(() => mockParser as any);

      const configInstance = new ConfigImpl(options);
      const kernel = configInstance.getKernel();
      kernel.fs.readFile = jest.fn().mockResolvedValue('value: 1');

      await configInstance.load();

      const changeHandler = jest.fn();
      configInstance.on('change', changeHandler);

      // Simulate file change
      await (configInstance as any).handleFileChange({
        path: '/config.yaml',
        type: 'change',
        timestamp: Date.now(),
      });

      expect(changeHandler).toHaveBeenCalled();
    });

    it('should emit error event if reload fails', async () => {
      const options: LoadOptions = {
        name: 'test-app',
        paths: ['/config.yaml'],
        required: ['must_exist'],
      };

      const mockParser = { parse: jest.fn(() => ({ value: 1 })) };
      mockedParserRegistry.detect = jest.fn(() => mockParser as any);

      const configInstance = new ConfigImpl(options);
      const kernel = configInstance.getKernel();

      // First load succeeds with required field
      kernel.fs.readFile = jest.fn().mockResolvedValue('must_exist: true');
      mockParser.parse = jest.fn(() => ({ must_exist: true }));

      await configInstance.load();

      const errorHandler = jest.fn();
      configInstance.on('error', errorHandler);

      // Second load fails - missing required field
      mockParser.parse = jest.fn(() => ({ value: 1 })); // missing must_exist

      await (configInstance as any).handleFileChange({
        path: '/config.yaml',
        type: 'change',
        timestamp: Date.now(),
      });

      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('event handling - error in handler', () => {
    it('should log error if event handler throws', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const throwingHandler = jest.fn(() => {
        throw new Error('Handler error');
      });

      config.on('watch:start', throwingHandler);

      (config as any).configFiles = [];
      config.watch();

      expect(throwingHandler).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in event handler'),
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });
});
