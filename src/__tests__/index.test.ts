// @ts-nocheck
/**
 * Tests for index.ts - main entry point
 */

import { jest } from '@jest/globals';
import {
  loadConfig,
  createConfig,
  defineConfig,
  VERSION,
} from '../index.js';

// Mock config.ts
jest.mock('../config.js', () => ({
  createConfigInstance: jest.fn(),
  ConfigImpl: class MockConfigImpl {},
}));

import { createConfigInstance } from '../config.js';

const mockedCreateConfigInstance = createConfigInstance as jest.MockedFunction<typeof createConfigInstance>;

describe('loadConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create config instance and load it', async () => {
    const mockConfig = {
      load: jest.fn().mockResolvedValue(undefined),
    };

    mockedCreateConfigInstance.mockReturnValue(mockConfig as any);

    const options = {
      name: 'test-app',
      env: 'development',
    };

    const config = await loadConfig(options);

    expect(mockedCreateConfigInstance).toHaveBeenCalledWith(options);
    expect(mockConfig.load).toHaveBeenCalled();
    expect(config).toBe(mockConfig);
  });

  it('should handle typed config', async () => {
    interface AppConfig {
      port: number;
      host: string;
    }

    const mockConfig = {
      load: jest.fn().mockResolvedValue(undefined),
    };

    mockedCreateConfigInstance.mockReturnValue(mockConfig as any);

    const config = await loadConfig<AppConfig>({ name: 'test' });

    expect(config).toBe(mockConfig);
  });

  it('should pass through options correctly', async () => {
    const mockConfig = {
      load: jest.fn().mockResolvedValue(undefined),
    };

    mockedCreateConfigInstance.mockReturnValue(mockConfig as any);

    const options = {
      name: 'myapp',
      paths: ['./config.yaml'],
      env: 'production',
      cwd: '/custom/dir',
      defaults: { port: 3000 },
      required: ['port'],
    };

    await loadConfig(options);

    expect(mockedCreateConfigInstance).toHaveBeenCalledWith(options);
  });

  it('should propagate load errors', async () => {
    const mockConfig = {
      load: jest.fn().mockRejectedValue(new Error('Load failed')),
    };

    mockedCreateConfigInstance.mockReturnValue(mockConfig as any);

    await expect(loadConfig({ name: 'test' })).rejects.toThrow('Load failed');
  });
});

describe('createConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create config instance from data', () => {
    const mockConfig = {};
    mockedCreateConfigInstance.mockReturnValue(mockConfig as any);

    const data = { port: 3000, host: 'localhost' };
    const config = createConfig(data);

    expect(mockedCreateConfigInstance).toHaveBeenCalledWith({
      name: 'app',
      defaults: data,
    });
    expect(config).toBe(mockConfig);
  });

  it('should set data directly on instance', () => {
    const mockConfig: any = {};
    mockedCreateConfigInstance.mockReturnValue(mockConfig);

    const data = { port: 3000 };

    createConfig(data);

    expect(mockConfig.data).toEqual(data);
  });

  it('should handle typed config', () => {
    const mockConfig = {};
    mockedCreateConfigInstance.mockReturnValue(mockConfig as any);

    interface AppConfig {
      port: number;
      host: string;
    }

    const data: AppConfig = { port: 3000, host: 'localhost' };
    const config = createConfig<AppConfig>(data);

    expect(config).toBe(mockConfig);
  });

  it('should handle empty data', () => {
    const mockConfig: any = {};
    mockedCreateConfigInstance.mockReturnValue(mockConfig as any);

    const config = createConfig({});

    expect(mockConfig.data).toEqual({});
  });

  it('should handle complex nested data', () => {
    const mockConfig: any = {};
    mockedCreateConfigInstance.mockReturnValue(mockConfig as any);

    const data = {
      server: {
        port: 3000,
        host: 'localhost',
      },
      database: {
        host: 'db.local',
        port: 5432,
        credentials: {
          username: 'user',
          password: 'pass',
        },
      },
    };

    createConfig(data);

    expect(mockConfig.data).toEqual(data);
  });
});

describe('defineConfig', () => {
  it('should return the input data', () => {
    const data = { port: 3000, host: 'localhost' };
    const result = defineConfig(data);

    expect(result).toBe(data);
  });

  it('should work with typed config', () => {
    interface AppConfig {
      port: number;
      host: string;
    }

    const data: AppConfig = { port: 3000, host: 'localhost' };
    const result = defineConfig<AppConfig>(data);

    expect(result).toEqual(data);
  });

  it('should handle complex config schemas', () => {
    const schema = {
      server: {
        port: 3000,
        host: 'localhost',
      },
      database: {
        host: 'localhost',
        port: 5432,
      },
      features: ['auth', 'logging'],
    };

    const result = defineConfig(schema);

    expect(result).toEqual(schema);
  });

  it('should preserve data types', () => {
    const data = {
      number: 42,
      string: 'text',
      boolean: true,
      null: null,
      array: [1, 2, 3],
      object: { key: 'value' },
    };

    const result = defineConfig(data);

    expect(result).toEqual(data);
    expect(typeof result.number).toBe('number');
    expect(typeof result.string).toBe('string');
    expect(typeof result.boolean).toBe('boolean');
    expect(Array.isArray(result.array)).toBe(true);
  });
});

describe('VERSION', () => {
  it('should be defined', () => {
    expect(VERSION).toBeDefined();
    expect(typeof VERSION).toBe('string');
  });

  it('should follow semantic versioning', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+(-.*)?$/);
  });

  it('should be the expected version', () => {
    expect(VERSION).toBe('1.0.0');
  });
});

describe('exports', () => {
  // Note: TypeScript types (export type) are erased at runtime
  // They cannot be tested as runtime values

  it('should export error classes', async () => {
    const module = await import('../index.js');

    expect(module.ConfigError).toBeDefined();
    expect(module.ConfigNotFoundError).toBeDefined();
    expect(module.ParseError).toBeDefined();
    expect(module.ValidationError).toBeDefined();
    expect(module.RequiredFieldError).toBeDefined();
    expect(module.EncryptionError).toBeDefined();
    expect(module.PluginError).toBeDefined();
  });

  it('should export utility functions', async () => {
    const module = await import('../index.js');

    expect(module.get).toBeDefined();
    expect(module.set).toBeDefined();
    expect(module.has).toBeDefined();
    expect(module.deletePath).toBeDefined();
    expect(module.deepClone).toBeDefined();
    expect(module.getAllPaths).toBeDefined();
    expect(module.merge).toBeDefined();
    expect(module.mergeConfigs).toBeDefined();
    expect(module.selectStrategy).toBeDefined();
    expect(module.mergeArrays).toBeDefined();
    expect(module.readFile).toBeDefined();
    expect(module.exists).toBeDefined();
    expect(module.resolvePaths).toBeDefined();
    expect(module.findConfigFiles).toBeDefined();
    expect(module.detectFormat).toBeDefined();
    expect(module.watchFile).toBeDefined();
    expect(module.encrypt).toBeDefined();
    expect(module.decrypt).toBeDefined();
    expect(module.isEncrypted).toBeDefined();
    expect(module.encryptObject).toBeDefined();
    expect(module.decryptObject).toBeDefined();
    expect(module.generateSalt).toBeDefined();
    expect(module.generateIV).toBeDefined();
    expect(module.deriveKey).toBeDefined();
    expect(module.hashString).toBeDefined();
    expect(module.validateOptions).toBeDefined();
  });

  it('should export parsers', async () => {
    const module = await import('../index.js');

    expect(module.parserRegistry).toBeDefined();
    expect(module.jsonParser).toBeDefined();
    expect(module.yamlParser).toBeDefined();
    expect(module.tomlParser).toBeDefined();
    expect(module.iniParser).toBeDefined();
    expect(module.envParser).toBeDefined();
  });

  it('should export kernel', async () => {
    const module = await import('../index.js');

    expect(module.createKernel).toBeDefined();
    // ConfigKernel is exported as a type, not a runtime value
  });

  it('should export config functions', async () => {
    const module = await import('../index.js');

    expect(module.ConfigImpl).toBeDefined();
    expect(module.createConfigInstance).toBeDefined();
  });
});

describe('default export', () => {
  it('should have default export', async () => {
    const module = await import('../index.js');

    expect(module.default).toBeDefined();
    expect(module.default.loadConfig).toBe(loadConfig);
    expect(module.default.createConfig).toBe(createConfig);
    expect(module.default.defineConfig).toBe(defineConfig);
    expect(module.default.VERSION).toBe(VERSION);
  });
});

describe('Integration tests', () => {
  it('should work with typical usage pattern', async () => {
    const mockConfig: any = {
      get: jest.fn((path) => {
        if (path === 'port') return 3000;
        return undefined;
      }),
      load: jest.fn().mockResolvedValue(undefined),
    };

    mockedCreateConfigInstance.mockReturnValue(mockConfig);

    const config = await loadConfig({
      name: 'myapp',
      paths: ['./config.yaml'],
    });

    expect(config.get('port')).toBe(3000);
  });

  it('should support config creation with defaults', () => {
    const mockConfig: any = {};
    mockedCreateConfigInstance.mockReturnValue(mockConfig);

    const config = createConfig({
      port: 3000,
      host: 'localhost',
    });

    expect(mockConfig.data).toEqual({
      port: 3000,
      host: 'localhost',
    });
  });

  it('should support defineConfig for type safety', () => {
    interface AppConfig {
      port: number;
      host: string;
      database?: {
        host: string;
        port: number;
      };
    }

    const config = defineConfig<AppConfig>({
      port: 3000,
      host: 'localhost',
    });

    expect(config.port).toBe(3000);
    expect(config.host).toBe('localhost');
  });
});
