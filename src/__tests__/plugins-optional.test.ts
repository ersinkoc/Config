// @ts-nocheck
/**
 * Tests for optional plugins
 */

import { validationPlugin } from '../plugins/optional/validation.js';
import { cachePlugin } from '../plugins/optional/cache.js';
import { watchPlugin } from '../plugins/optional/watch.js';
import { interpolationPlugin } from '../plugins/optional/interpolation.js';
import { encryptionPlugin } from '../plugins/optional/encryption.js';
import { yamlParserPlugin } from '../plugins/optional/yaml-parser.js';
import { tomlParserPlugin } from '../plugins/optional/toml-parser.js';
import { iniParserPlugin } from '../plugins/optional/ini-parser.js';
import { ValidationError } from '../errors.js';

// Import default exports
import validationDefault from '../plugins/optional/validation.js';
import cacheDefault from '../plugins/optional/cache.js';
import watchDefault from '../plugins/optional/watch.js';
import interpolationDefault from '../plugins/optional/interpolation.js';
import encryptionDefault from '../plugins/optional/encryption.js';
import yamlParserDefault from '../plugins/optional/yaml-parser.js';
import tomlParserDefault from '../plugins/optional/toml-parser.js';
import iniParserDefault from '../plugins/optional/ini-parser.js';

// Mock kernel
const createMockKernel = () => ({
  context: {},
  load: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  has: jest.fn(),
  merge: jest.fn(),
  watch: jest.fn(),
  unwatch: jest.fn(),
  use: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
});

describe('validationPlugin', () => {
  describe('plugin interface', () => {
    it('should have correct name', () => {
      const plugin = validationPlugin({ schema: {} });
      expect(plugin.name).toBe('validation');
    });

    it('should have correct version', () => {
      const plugin = validationPlugin({ schema: {} });
      expect(plugin.version).toBe('1.0.0');
    });

    it('should have install method', () => {
      const plugin = validationPlugin({ schema: {} });
      expect(typeof plugin.install).toBe('function');
    });

    it('should have onAfterMerge hook', () => {
      const plugin = validationPlugin({ schema: {} });
      expect(typeof plugin.onAfterMerge).toBe('function');
    });
  });

  describe('install', () => {
    it('should store schema in kernel context', () => {
      const schema = { type: 'object' };
      const plugin = validationPlugin({ schema });
      const kernel = createMockKernel();

      plugin.install(kernel);

      expect(kernel.context.validationSchema).toBe(schema);
    });
  });

  describe('onAfterMerge - type validation', () => {
    it('should pass valid object type', () => {
      const plugin = validationPlugin({
        schema: { type: 'object' },
      });
      const kernel = createMockKernel();
      plugin.install(kernel);

      const config = { key: 'value' };
      const result = plugin.onAfterMerge(config);

      expect(result).toBe(config);
    });

    it('should throw for wrong root type', () => {
      const plugin = validationPlugin({
        schema: { type: 'object' },
      });
      const kernel = createMockKernel();
      plugin.install(kernel);

      expect(() => plugin.onAfterMerge('string')).toThrow(ValidationError);
    });

    it('should validate string type', () => {
      const plugin = validationPlugin({
        schema: { type: 'string' },
      });
      const kernel = createMockKernel();
      plugin.install(kernel);

      expect(plugin.onAfterMerge('hello')).toBe('hello');
      expect(() => plugin.onAfterMerge(42)).toThrow(ValidationError);
    });

    it('should validate number type', () => {
      const plugin = validationPlugin({
        schema: { type: 'number' },
      });
      const kernel = createMockKernel();
      plugin.install(kernel);

      expect(plugin.onAfterMerge(42)).toBe(42);
      expect(() => plugin.onAfterMerge('42')).toThrow(ValidationError);
    });

    it('should validate boolean type', () => {
      const plugin = validationPlugin({
        schema: { type: 'boolean' },
      });
      const kernel = createMockKernel();
      plugin.install(kernel);

      expect(plugin.onAfterMerge(true)).toBe(true);
      expect(() => plugin.onAfterMerge(1)).toThrow(ValidationError);
    });

    it('should validate array type', () => {
      const plugin = validationPlugin({
        schema: { type: 'array' },
      });
      const kernel = createMockKernel();
      plugin.install(kernel);

      expect(plugin.onAfterMerge([1, 2, 3])).toEqual([1, 2, 3]);
      expect(() => plugin.onAfterMerge({ 0: 1 })).toThrow(ValidationError);
    });

    it('should validate null type', () => {
      const plugin = validationPlugin({
        schema: { type: 'null' },
      });
      const kernel = createMockKernel();
      plugin.install(kernel);

      expect(plugin.onAfterMerge(null)).toBe(null);
      expect(() => plugin.onAfterMerge(undefined)).toThrow(ValidationError);
    });
  });

  describe('onAfterMerge - properties validation', () => {
    it('should validate property types', () => {
      const plugin = validationPlugin({
        schema: {
          type: 'object',
          properties: {
            port: { type: 'number' },
            host: { type: 'string' },
          },
        },
      });
      const kernel = createMockKernel();
      plugin.install(kernel);

      const validConfig = { port: 3000, host: 'localhost' };
      expect(plugin.onAfterMerge(validConfig)).toBe(validConfig);
    });

    it('should throw for invalid property type', () => {
      const plugin = validationPlugin({
        schema: {
          type: 'object',
          properties: {
            port: { type: 'number' },
          },
        },
      });
      const kernel = createMockKernel();
      plugin.install(kernel);

      const invalidConfig = { port: 'not-a-number' };
      expect(() => plugin.onAfterMerge(invalidConfig)).toThrow(ValidationError);
    });

    it('should validate nested properties', () => {
      const plugin = validationPlugin({
        schema: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                host: { type: 'string' },
                port: { type: 'number' },
              },
            },
          },
        },
      });
      const kernel = createMockKernel();
      plugin.install(kernel);

      const validConfig = {
        database: {
          host: 'localhost',
          port: 5432,
        },
      };
      expect(plugin.onAfterMerge(validConfig)).toBe(validConfig);
    });

    it('should throw for invalid nested property', () => {
      const plugin = validationPlugin({
        schema: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                port: { type: 'number' },
              },
            },
          },
        },
      });
      const kernel = createMockKernel();
      plugin.install(kernel);

      const invalidConfig = {
        database: {
          port: 'not-a-number',
        },
      };
      expect(() => plugin.onAfterMerge(invalidConfig)).toThrow(ValidationError);
    });
  });

  describe('onAfterMerge - required fields', () => {
    it('should pass when all required fields present', () => {
      const plugin = validationPlugin({
        schema: {
          type: 'object',
          required: ['name', 'version'],
        },
      });
      const kernel = createMockKernel();
      plugin.install(kernel);

      const config = { name: 'test', version: '1.0.0' };
      expect(plugin.onAfterMerge(config)).toBe(config);
    });

    it('should throw for missing required field', () => {
      const plugin = validationPlugin({
        schema: {
          type: 'object',
          required: ['name', 'version'],
        },
      });
      const kernel = createMockKernel();
      plugin.install(kernel);

      const config = { name: 'test' };
      expect(() => plugin.onAfterMerge(config)).toThrow(ValidationError);
    });

    it('should validate required fields in nested objects', () => {
      const plugin = validationPlugin({
        schema: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              required: ['host'],
            },
          },
        },
      });
      const kernel = createMockKernel();
      plugin.install(kernel);

      const validConfig = { database: { host: 'localhost' } };
      expect(plugin.onAfterMerge(validConfig)).toBe(validConfig);

      const invalidConfig = { database: {} };
      expect(() => plugin.onAfterMerge(invalidConfig)).toThrow(ValidationError);
    });
  });

  describe('error messages', () => {
    it('should include path in error for property type mismatch', () => {
      const plugin = validationPlugin({
        schema: {
          type: 'object',
          properties: {
            port: { type: 'number' },
          },
        },
      });
      const kernel = createMockKernel();
      plugin.install(kernel);

      try {
        plugin.onAfterMerge({ port: 'invalid' });
        fail('Should throw');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).errors[0].path).toBe('port');
      }
    });

    it('should include expected and actual types', () => {
      const plugin = validationPlugin({
        schema: {
          type: 'object',
          properties: {
            port: { type: 'number' },
          },
        },
      });
      const kernel = createMockKernel();
      plugin.install(kernel);

      try {
        plugin.onAfterMerge({ port: 'invalid' });
        fail('Should throw');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const issue = (error as ValidationError).errors[0];
        expect(issue.expected).toBe('number');
        expect(issue.actual).toBe('string');
      }
    });
  });

  describe('default export', () => {
    it('should export default plugin instance', () => {
      expect(validationDefault).toBeDefined();
      expect(validationDefault.name).toBe('validation');
    });
  });
});

describe('cachePlugin', () => {
  describe('plugin interface', () => {
    it('should have correct name', () => {
      const plugin = cachePlugin({});
      expect(plugin.name).toBe('cache');
    });

    it('should have correct version', () => {
      const plugin = cachePlugin({});
      expect(plugin.version).toBe('1.0.0');
    });

    it('should have install method', () => {
      const plugin = cachePlugin({});
      expect(typeof plugin.install).toBe('function');
    });
  });

  describe('install', () => {
    it('should not throw during installation', () => {
      const plugin = cachePlugin({ ttl: 5000 });
      const kernel = createMockKernel();

      expect(() => plugin.install(kernel)).not.toThrow();
    });
  });

  describe('options', () => {
    it('should accept ttl option', () => {
      const plugin = cachePlugin({ ttl: 10000 });
      expect(plugin.name).toBe('cache');
    });

    it('should accept empty options', () => {
      const plugin = cachePlugin({});
      expect(plugin.name).toBe('cache');
    });
  });

  describe('default export', () => {
    it('should export default plugin instance', () => {
      expect(cacheDefault).toBeDefined();
      expect(cacheDefault.name).toBe('cache');
    });
  });
});

describe('watchPlugin', () => {
  describe('plugin interface', () => {
    it('should have correct name', () => {
      const plugin = watchPlugin();
      expect(plugin.name).toBe('watch');
    });

    it('should have correct version', () => {
      const plugin = watchPlugin();
      expect(plugin.version).toBe('1.0.0');
    });

    it('should have install method', () => {
      const plugin = watchPlugin();
      expect(typeof plugin.install).toBe('function');
    });
  });

  describe('install', () => {
    it('should not throw during installation', () => {
      const plugin = watchPlugin();
      const kernel = createMockKernel();

      expect(() => plugin.install(kernel)).not.toThrow();
    });
  });

  describe('default export', () => {
    it('should export default plugin instance', () => {
      expect(watchDefault).toBeDefined();
      expect(watchDefault.name).toBe('watch');
    });
  });
});

describe('interpolationPlugin', () => {
  describe('plugin interface', () => {
    it('should have correct name', () => {
      const plugin = interpolationPlugin();
      expect(plugin.name).toBe('interpolation');
    });

    it('should have correct version', () => {
      const plugin = interpolationPlugin();
      expect(plugin.version).toBe('1.0.0');
    });

    it('should have install method', () => {
      const plugin = interpolationPlugin();
      expect(typeof plugin.install).toBe('function');
    });
  });

  describe('install', () => {
    it('should not throw during installation', () => {
      const plugin = interpolationPlugin();
      const kernel = createMockKernel();

      expect(() => plugin.install(kernel)).not.toThrow();
    });
  });

  describe('default export', () => {
    it('should export default plugin instance', () => {
      expect(interpolationDefault).toBeDefined();
      expect(interpolationDefault.name).toBe('interpolation');
    });
  });
});

describe('encryptionPlugin', () => {
  describe('plugin interface', () => {
    it('should have correct name', () => {
      const plugin = encryptionPlugin({ key: 'secret' });
      expect(plugin.name).toBe('encryption');
    });

    it('should have correct version', () => {
      const plugin = encryptionPlugin({ key: 'secret' });
      expect(plugin.version).toBe('1.0.0');
    });

    it('should have install method', () => {
      const plugin = encryptionPlugin({ key: 'secret' });
      expect(typeof plugin.install).toBe('function');
    });
  });

  describe('install', () => {
    it('should not throw during installation', () => {
      const plugin = encryptionPlugin({ key: 'test-key' });
      const kernel = createMockKernel();

      expect(() => plugin.install(kernel)).not.toThrow();
    });
  });

  describe('options', () => {
    it('should require key option', () => {
      const plugin = encryptionPlugin({ key: 'my-secret-key' });
      expect(plugin.name).toBe('encryption');
    });
  });

  describe('default export', () => {
    it('should export default plugin instance', () => {
      expect(encryptionDefault).toBeDefined();
      expect(encryptionDefault.name).toBe('encryption');
    });
  });
});

describe('yamlParserPlugin', () => {
  describe('plugin interface', () => {
    it('should have correct name', () => {
      const plugin = yamlParserPlugin();
      expect(plugin.name).toBe('yaml-parser');
    });

    it('should have correct version', () => {
      const plugin = yamlParserPlugin();
      expect(plugin.version).toBe('1.0.0');
    });

    it('should have install method', () => {
      const plugin = yamlParserPlugin();
      expect(typeof plugin.install).toBe('function');
    });
  });

  describe('install', () => {
    it('should not throw during installation', () => {
      const plugin = yamlParserPlugin();
      const kernel = createMockKernel();

      expect(() => plugin.install(kernel)).not.toThrow();
    });
  });

  describe('default export', () => {
    it('should export default plugin instance', () => {
      expect(yamlParserDefault).toBeDefined();
      expect(yamlParserDefault.name).toBe('yaml-parser');
    });
  });
});

describe('tomlParserPlugin', () => {
  describe('plugin interface', () => {
    it('should have correct name', () => {
      const plugin = tomlParserPlugin();
      expect(plugin.name).toBe('toml-parser');
    });

    it('should have correct version', () => {
      const plugin = tomlParserPlugin();
      expect(plugin.version).toBe('1.0.0');
    });

    it('should have install method', () => {
      const plugin = tomlParserPlugin();
      expect(typeof plugin.install).toBe('function');
    });
  });

  describe('install', () => {
    it('should not throw during installation', () => {
      const plugin = tomlParserPlugin();
      const kernel = createMockKernel();

      expect(() => plugin.install(kernel)).not.toThrow();
    });
  });

  describe('default export', () => {
    it('should export default plugin instance', () => {
      expect(tomlParserDefault).toBeDefined();
      expect(tomlParserDefault.name).toBe('toml-parser');
    });
  });
});

describe('iniParserPlugin', () => {
  describe('plugin interface', () => {
    it('should have correct name', () => {
      const plugin = iniParserPlugin();
      expect(plugin.name).toBe('ini-parser');
    });

    it('should have correct version', () => {
      const plugin = iniParserPlugin();
      expect(plugin.version).toBe('1.0.0');
    });

    it('should have install method', () => {
      const plugin = iniParserPlugin();
      expect(typeof plugin.install).toBe('function');
    });
  });

  describe('install', () => {
    it('should not throw during installation', () => {
      const plugin = iniParserPlugin();
      const kernel = createMockKernel();

      expect(() => plugin.install(kernel)).not.toThrow();
    });
  });

  describe('default export', () => {
    it('should export default plugin instance', () => {
      expect(iniParserDefault).toBeDefined();
      expect(iniParserDefault.name).toBe('ini-parser');
    });
  });
});
