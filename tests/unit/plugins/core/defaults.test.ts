/**
 * Tests for defaults plugin.
 */

import { describe, it, expect, vi } from 'vitest';
import { defaultsPlugin } from '../../../../src/plugins/core/defaults.js';
import defaults from '../../../../src/plugins/core/defaults.js';
import { RequiredFieldError } from '../../../../src/errors.js';
import type { ConfigKernel } from '../../../../src/kernel.js';

describe('defaultsPlugin', () => {
  describe('plugin properties', () => {
    it('should have correct name', () => {
      const plugin = defaultsPlugin();
      expect(plugin.name).toBe('defaults');
    });

    it('should have correct version', () => {
      const plugin = defaultsPlugin();
      expect(plugin.version).toBe('1.0.0');
    });
  });

  describe('install', () => {
    it('should install without error', () => {
      const plugin = defaultsPlugin();
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      expect(() => plugin.install(mockKernel)).not.toThrow();
    });

    it('should store empty defaults in kernel context by default', () => {
      const plugin = defaultsPlugin();
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      plugin.install(mockKernel);
      expect((mockKernel.context as any).defaults).toEqual({});
      expect((mockKernel.context as any).required).toEqual([]);
    });

    it('should store custom defaults in kernel context', () => {
      const plugin = defaultsPlugin({ port: 3000, host: 'localhost' });
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      plugin.install(mockKernel);
      expect((mockKernel.context as any).defaults).toEqual({
        port: 3000,
        host: 'localhost',
      });
    });

    it('should store required fields in kernel context', () => {
      const plugin = defaultsPlugin({}, ['database.host', 'port']);
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      plugin.install(mockKernel);
      expect((mockKernel.context as any).required).toEqual(['database.host', 'port']);
    });
  });

  describe('onAfterMerge', () => {
    it('should apply defaults for missing keys', () => {
      const plugin = defaultsPlugin({ port: 3000, host: 'localhost' });
      const config = { name: 'app' };

      const result = plugin.onAfterMerge!(config);
      expect(result).toEqual({
        name: 'app',
        port: 3000,
        host: 'localhost',
      });
    });

    it('should not override existing values', () => {
      const plugin = defaultsPlugin({ port: 3000, host: 'localhost' });
      const config = { port: 8080 };

      const result = plugin.onAfterMerge!(config);
      expect(result).toEqual({
        port: 8080,
        host: 'localhost',
      });
    });

    it('should throw RequiredFieldError for missing required fields', () => {
      const plugin = defaultsPlugin({}, ['database.host']);
      const config = { port: 3000 };

      expect(() => plugin.onAfterMerge!(config)).toThrow(RequiredFieldError);
    });

    it('should pass validation with all required fields present', () => {
      const plugin = defaultsPlugin({}, ['port']);
      const config = { port: 3000 };

      const result = plugin.onAfterMerge!(config);
      expect(result).toEqual({ port: 3000 });
    });

    it('should validate nested required fields', () => {
      const plugin = defaultsPlugin({}, ['database.host']);
      const config = { database: { host: 'localhost' } };

      const result = plugin.onAfterMerge!(config);
      expect(result).toEqual({ database: { host: 'localhost' } });
    });

    it('should throw for missing nested required fields', () => {
      const plugin = defaultsPlugin({}, ['database.host']);
      const config = { database: {} };

      expect(() => plugin.onAfterMerge!(config)).toThrow(RequiredFieldError);
    });

    it('should handle both defaults and required fields', () => {
      const plugin = defaultsPlugin({ port: 3000 }, ['name']);
      const config = { name: 'app' };

      const result = plugin.onAfterMerge!(config);
      expect(result).toEqual({
        name: 'app',
        port: 3000,
      });
    });

    it('should handle empty config with defaults', () => {
      const plugin = defaultsPlugin({ port: 3000 });
      const config = {};

      const result = plugin.onAfterMerge!(config);
      expect(result).toEqual({ port: 3000 });
    });

    it('should handle undefined values in config', () => {
      const plugin = defaultsPlugin({ port: 3000 });
      const config = { port: undefined };

      const result = plugin.onAfterMerge!(config);
      expect(result).toEqual({ port: 3000 });
    });
  });

  describe('default export', () => {
    it('should export a plugin instance', () => {
      expect(defaults).toBeDefined();
      expect(defaults.name).toBe('defaults');
      expect(defaults.version).toBe('1.0.0');
    });
  });

  describe('factory function', () => {
    it('should return new plugin instance each time', () => {
      const plugin1 = defaultsPlugin();
      const plugin2 = defaultsPlugin();
      expect(plugin1).not.toBe(plugin2);
      expect(plugin1.name).toBe(plugin2.name);
    });

    it('should handle complex default values', () => {
      const plugin = defaultsPlugin({
        database: { host: 'localhost', port: 5432 },
        features: ['auth', 'logging'],
      });
      const config = {};

      const result = plugin.onAfterMerge!(config);
      expect(result).toEqual({
        database: { host: 'localhost', port: 5432 },
        features: ['auth', 'logging'],
      });
    });
  });
});
