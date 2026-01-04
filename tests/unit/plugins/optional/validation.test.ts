/**
 * Tests for validation plugin.
 */

import { describe, it, expect, vi } from 'vitest';
import { validationPlugin } from '../../../../src/plugins/optional/validation.js';
import validation from '../../../../src/plugins/optional/validation.js';
import { ValidationError } from '../../../../src/errors.js';
import type { ConfigKernel } from '../../../../src/kernel.js';

describe('validationPlugin', () => {
  describe('plugin properties', () => {
    it('should have correct name', () => {
      const plugin = validationPlugin({ schema: {} });
      expect(plugin.name).toBe('validation');
    });

    it('should have correct version', () => {
      const plugin = validationPlugin({ schema: {} });
      expect(plugin.version).toBe('1.0.0');
    });
  });

  describe('install', () => {
    it('should install without error', () => {
      const plugin = validationPlugin({ schema: {} });
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      expect(() => plugin.install(mockKernel)).not.toThrow();
    });

    it('should store schema in kernel context', () => {
      const schema = { type: 'object' };
      const plugin = validationPlugin({ schema });
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      plugin.install(mockKernel);
      expect((mockKernel.context as any).validationSchema).toBe(schema);
    });
  });

  describe('onAfterMerge', () => {
    it('should pass validation with matching type', () => {
      const plugin = validationPlugin({
        schema: { type: 'object' },
      });
      const config = { port: 3000 };

      const result = plugin.onAfterMerge!(config);
      expect(result).toBe(config);
    });

    it('should throw for type mismatch', () => {
      const plugin = validationPlugin({
        schema: { type: 'string' },
      });
      const config = { port: 3000 };

      expect(() => plugin.onAfterMerge!(config)).toThrow(ValidationError);
    });

    it('should validate properties', () => {
      const plugin = validationPlugin({
        schema: {
          type: 'object',
          properties: {
            port: { type: 'number' },
          },
        },
      });
      const config = { port: 3000 };

      const result = plugin.onAfterMerge!(config);
      expect(result).toBe(config);
    });

    it('should throw for property type mismatch', () => {
      const plugin = validationPlugin({
        schema: {
          type: 'object',
          properties: {
            port: { type: 'number' },
          },
        },
      });
      const config = { port: 'not a number' };

      expect(() => plugin.onAfterMerge!(config)).toThrow(ValidationError);
    });

    it('should validate required fields', () => {
      const plugin = validationPlugin({
        schema: {
          type: 'object',
          required: ['port'],
        },
      });
      const config = { port: 3000 };

      const result = plugin.onAfterMerge!(config);
      expect(result).toBe(config);
    });

    it('should throw for missing required fields', () => {
      const plugin = validationPlugin({
        schema: {
          type: 'object',
          required: ['port'],
        },
      });
      const config = { host: 'localhost' };

      expect(() => plugin.onAfterMerge!(config)).toThrow(ValidationError);
    });

    it('should validate nested objects', () => {
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
      const config = { database: { port: 5432 } };

      const result = plugin.onAfterMerge!(config);
      expect(result).toBe(config);
    });

    it('should throw for nested type mismatch', () => {
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
      const config = { database: { port: 'string' } };

      expect(() => plugin.onAfterMerge!(config)).toThrow(ValidationError);
    });

    it('should validate nested required fields', () => {
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
      const config = { database: { port: 5432 } };

      expect(() => plugin.onAfterMerge!(config)).toThrow(ValidationError);
    });

    it('should handle null values', () => {
      const plugin = validationPlugin({
        schema: { type: 'null' },
      });
      const config = null;

      const result = plugin.onAfterMerge!(config);
      expect(result).toBeNull();
    });

    it('should handle array values', () => {
      const plugin = validationPlugin({
        schema: { type: 'array' },
      });
      const config = [1, 2, 3];

      const result = plugin.onAfterMerge!(config);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should throw for array when expecting object', () => {
      const plugin = validationPlugin({
        schema: { type: 'object' },
      });
      const config = [1, 2, 3];

      expect(() => plugin.onAfterMerge!(config)).toThrow(ValidationError);
    });

    it('should handle boolean values', () => {
      const plugin = validationPlugin({
        schema: { type: 'boolean' },
      });
      const config = true;

      const result = plugin.onAfterMerge!(config);
      expect(result).toBe(true);
    });

    it('should handle number values', () => {
      const plugin = validationPlugin({
        schema: { type: 'number' },
      });
      const config = 42;

      const result = plugin.onAfterMerge!(config);
      expect(result).toBe(42);
    });

    it('should handle string values', () => {
      const plugin = validationPlugin({
        schema: { type: 'string' },
      });
      const config = 'hello';

      const result = plugin.onAfterMerge!(config);
      expect(result).toBe('hello');
    });

    it('should handle empty schema', () => {
      const plugin = validationPlugin({
        schema: {},
      });
      const config = { any: 'value' };

      const result = plugin.onAfterMerge!(config);
      expect(result).toBe(config);
    });
  });

  describe('default export', () => {
    it('should export a plugin instance', () => {
      expect(validation).toBeDefined();
      expect(validation.name).toBe('validation');
      expect(validation.version).toBe('1.0.0');
    });
  });

  describe('factory function', () => {
    it('should return new plugin instance each time', () => {
      const plugin1 = validationPlugin({ schema: {} });
      const plugin2 = validationPlugin({ schema: {} });
      expect(plugin1).not.toBe(plugin2);
      expect(plugin1.name).toBe(plugin2.name);
    });

    it('should accept complex schemas', () => {
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
              required: ['host'],
            },
            features: { type: 'array' },
          },
          required: ['database'],
        },
      });

      expect(plugin.name).toBe('validation');
    });
  });
});
