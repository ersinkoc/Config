/**
 * Tests for main entry point (index.ts).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  loadConfig,
  createConfig,
  defineConfig,
  VERSION,
  // Re-exports
  ConfigError,
  ConfigNotFoundError,
  ParseError,
  ValidationError,
  RequiredFieldError,
  EncryptionError,
  PluginError,
  get,
  set,
  has,
  deletePath,
  deepClone,
  getAllPaths,
  merge,
  mergeConfigs,
  selectStrategy,
  mergeArrays,
  parserRegistry,
  createKernel,
  ConfigImpl,
  createConfigInstance,
} from '../../src/index.js';

// Mock file utilities
vi.mock('../../src/utils/file.js', () => ({
  findConfigFiles: vi.fn().mockReturnValue(['/test/config.json']),
  detectFormat: vi.fn().mockReturnValue('json'),
  readFile: vi.fn().mockResolvedValue('{"loaded": true}'),
  exists: vi.fn().mockResolvedValue(true),
  watchFile: vi.fn(),
  resolvePaths: vi.fn().mockReturnValue(['/test/config.json']),
}));

// Mock parser registry
vi.mock('../../src/parsers/index.js', () => ({
  parserRegistry: {
    detect: vi.fn().mockReturnValue({
      parse: (content: string) => JSON.parse(content || '{}'),
    }),
    register: vi.fn(),
    get: vi.fn(),
    list: vi.fn().mockReturnValue(['json', 'yaml']),
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

describe('Main API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('should load configuration from files', async () => {
      const config = await loadConfig({
        name: 'test',
        paths: ['/test/config.json'],
      });

      expect(config).toBeDefined();
      expect(config.get('loaded')).toBe(true);
    });

    it('should return typed config', async () => {
      interface TestConfig {
        loaded: boolean;
      }

      const config = await loadConfig<TestConfig>({
        name: 'test',
        paths: ['/test/config.json'],
      });

      expect(config.get('loaded')).toBe(true);
    });
  });

  describe('createConfig', () => {
    it('should create config with initial data', () => {
      const config = createConfig({
        port: 3000,
        host: 'localhost',
      });

      expect(config.get('port')).toBe(3000);
      expect(config.get('host')).toBe('localhost');
    });

    it('should allow setting values', () => {
      const config = createConfig({
        port: 3000,
      });

      config.set('port', 4000);
      expect(config.get('port')).toBe(4000);
    });

    it('should return typed config', () => {
      interface TestConfig {
        port: number;
        host: string;
      }

      const config = createConfig<TestConfig>({
        port: 3000,
        host: 'localhost',
      });

      expect(config.get('port')).toBe(3000);
    });
  });

  describe('defineConfig', () => {
    it('should return the same data', () => {
      const data = {
        port: 3000,
        host: 'localhost',
      };

      const result = defineConfig(data);
      expect(result).toEqual(data);
    });

    it('should work with typed config', () => {
      interface TestConfig {
        port: number;
        host: string;
      }

      const result = defineConfig<TestConfig>({
        port: 3000,
        host: 'localhost',
      });

      expect(result.port).toBe(3000);
      expect(result.host).toBe('localhost');
    });
  });

  describe('VERSION', () => {
    it('should be defined', () => {
      expect(VERSION).toBeDefined();
      expect(typeof VERSION).toBe('string');
    });

    it('should be semver format', () => {
      expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});

describe('Re-exports', () => {
  describe('Error classes', () => {
    it('should export ConfigError', () => {
      expect(ConfigError).toBeDefined();
      expect(new ConfigError('test', 'CODE')).toBeInstanceOf(Error);
    });

    it('should export ConfigNotFoundError', () => {
      expect(ConfigNotFoundError).toBeDefined();
      expect(new ConfigNotFoundError('/path')).toBeInstanceOf(ConfigError);
    });

    it('should export ParseError', () => {
      expect(ParseError).toBeDefined();
      expect(new ParseError('test', 'file.json')).toBeInstanceOf(ConfigError);
    });

    it('should export ValidationError', () => {
      expect(ValidationError).toBeDefined();
      expect(new ValidationError('test', [])).toBeInstanceOf(ConfigError);
    });

    it('should export RequiredFieldError', () => {
      expect(RequiredFieldError).toBeDefined();
      expect(new RequiredFieldError('field')).toBeInstanceOf(ConfigError);
    });

    it('should export EncryptionError', () => {
      expect(EncryptionError).toBeDefined();
      expect(new EncryptionError('test')).toBeInstanceOf(ConfigError);
    });

    it('should export PluginError', () => {
      expect(PluginError).toBeDefined();
      expect(new PluginError('test', 'plugin')).toBeInstanceOf(ConfigError);
    });
  });

  describe('Path utilities', () => {
    it('should export get', () => {
      expect(get).toBeDefined();
      expect(typeof get).toBe('function');
    });

    it('should export set', () => {
      expect(set).toBeDefined();
      expect(typeof set).toBe('function');
    });

    it('should export has', () => {
      expect(has).toBeDefined();
      expect(typeof has).toBe('function');
    });

    it('should export deletePath', () => {
      expect(deletePath).toBeDefined();
      expect(typeof deletePath).toBe('function');
    });

    it('should export deepClone', () => {
      expect(deepClone).toBeDefined();
      expect(typeof deepClone).toBe('function');
    });

    it('should export getAllPaths', () => {
      expect(getAllPaths).toBeDefined();
      expect(typeof getAllPaths).toBe('function');
    });
  });

  describe('Merge utilities', () => {
    it('should export merge', () => {
      expect(merge).toBeDefined();
      expect(typeof merge).toBe('function');
    });

    it('should export mergeConfigs', () => {
      expect(mergeConfigs).toBeDefined();
      expect(typeof mergeConfigs).toBe('function');
    });

    it('should export selectStrategy', () => {
      expect(selectStrategy).toBeDefined();
      expect(typeof selectStrategy).toBe('function');
    });

    it('should export mergeArrays', () => {
      expect(mergeArrays).toBeDefined();
      expect(typeof mergeArrays).toBe('function');
    });
  });

  describe('Parser registry', () => {
    it('should export parserRegistry', () => {
      expect(parserRegistry).toBeDefined();
      expect(parserRegistry.detect).toBeDefined();
    });
  });

  describe('Kernel', () => {
    it('should export createKernel', () => {
      expect(createKernel).toBeDefined();
      expect(typeof createKernel).toBe('function');
    });
  });

  describe('Config class', () => {
    it('should export ConfigImpl', () => {
      expect(ConfigImpl).toBeDefined();
    });

    it('should export createConfigInstance', () => {
      expect(createConfigInstance).toBeDefined();
      expect(typeof createConfigInstance).toBe('function');
    });
  });
});

describe('Default export', () => {
  it('should export default object with main functions', async () => {
    const defaultExport = (await import('../../src/index.js')).default;

    expect(defaultExport).toBeDefined();
    expect(defaultExport.loadConfig).toBe(loadConfig);
    expect(defaultExport.createConfig).toBe(createConfig);
    expect(defaultExport.defineConfig).toBe(defineConfig);
    expect(defaultExport.VERSION).toBe(VERSION);
  });
});
