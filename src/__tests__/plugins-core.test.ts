// @ts-nocheck
/**
 * Tests for plugins/core/*
 */

import { defaultsPlugin } from '../plugins/core/defaults.js';
import { mergePlugin } from '../plugins/core/merge.js';
import { jsonParserPlugin } from '../plugins/core/json-parser.js';
import { envParserPlugin } from '../plugins/core/env-parser.js';
import { RequiredFieldError } from '../errors.js';

describe('defaultsPlugin', () => {
  describe('plugin interface', () => {
    it('should have correct name and version', () => {
      const plugin = defaultsPlugin();

      expect(plugin.name).toBe('defaults');
      expect(plugin.version).toBe('1.0.0');
    });

    it('should have install function', () => {
      const plugin = defaultsPlugin();

      expect(typeof plugin.install).toBe('function');
    });

    it('should have onAfterMerge function', () => {
      const plugin = defaultsPlugin();

      expect(typeof plugin.onAfterMerge).toBe('function');
    });
  });

  describe('install', () => {
    it('should store defaults in kernel context', () => {
      const plugin = defaultsPlugin({ port: 3000 }, ['host']);
      const mockKernel = { context: {} };

      plugin.install(mockKernel as any);

      expect(mockKernel.context.defaults).toEqual({ port: 3000 });
      expect(mockKernel.context.required).toEqual(['host']);
    });

    it('should handle undefined defaults', () => {
      const plugin = defaultsPlugin();
      const mockKernel = { context: {} };

      plugin.install(mockKernel as any);

      expect(mockKernel.context.defaults).toEqual({});
      expect(mockKernel.context.required).toEqual([]);
    });
  });

  describe('onAfterMerge', () => {
    it('should apply defaults for missing keys', () => {
      const plugin = defaultsPlugin({ port: 3000, host: 'localhost' });
      const config = { host: 'custom.host' };

      const result = plugin.onAfterMerge(config);

      expect(result).toEqual({ port: 3000, host: 'custom.host' });
    });

    it('should not override existing values', () => {
      const plugin = defaultsPlugin({ port: 3000 });
      const config = { port: 8080 };

      const result = plugin.onAfterMerge(config);

      expect(result).toEqual({ port: 8080 });
    });

    it('should validate required fields', () => {
      const plugin = defaultsPlugin({}, ['database.host']);
      const config = { port: 3000 };

      expect(() => plugin.onAfterMerge(config)).toThrow(RequiredFieldError);
    });

    it('should pass when required fields are present', () => {
      const plugin = defaultsPlugin({}, ['port']);
      const config = { port: 3000 };

      expect(() => plugin.onAfterMerge(config)).not.toThrow();
    });

    it('should handle empty defaults and required', () => {
      const plugin = defaultsPlugin();
      const config = { key: 'value' };

      const result = plugin.onAfterMerge(config);

      expect(result).toEqual({ key: 'value' });
    });
  });
});

describe('mergePlugin', () => {
  describe('plugin interface', () => {
    it('should have correct name and version', () => {
      const plugin = mergePlugin();

      expect(plugin.name).toBe('merge');
      expect(plugin.version).toBe('1.0.0');
    });

    it('should have install function', () => {
      const plugin = mergePlugin();

      expect(typeof plugin.install).toBe('function');
    });

    it('should have onAfterMerge function', () => {
      const plugin = mergePlugin();

      expect(typeof plugin.onAfterMerge).toBe('function');
    });
  });

  describe('install', () => {
    it('should store strategies in kernel context', () => {
      const plugin = mergePlugin({ default: 'merge', arrays: 'unique' });
      const mockKernel = { context: {} };

      plugin.install(mockKernel as any);

      expect(mockKernel.context.mergeStrategies).toEqual({
        default: 'merge',
        arrays: 'unique',
      });
    });

    it('should use default strategies when none provided', () => {
      const plugin = mergePlugin();
      const mockKernel = { context: {} };

      plugin.install(mockKernel as any);

      expect(mockKernel.context.mergeStrategies).toEqual({
        default: 'merge',
        arrays: 'replace',
      });
    });
  });

  describe('onAfterMerge', () => {
    it('should return config unchanged', () => {
      const plugin = mergePlugin();
      const config = { key: 'value' };

      const result = plugin.onAfterMerge(config);

      expect(result).toEqual(config);
    });
  });
});

describe('jsonParserPlugin', () => {
  describe('plugin interface', () => {
    it('should have correct name and version', () => {
      const plugin = jsonParserPlugin();

      expect(plugin.name).toBe('json-parser');
      expect(plugin.version).toBe('1.0.0');
    });

    it('should have install function', () => {
      const plugin = jsonParserPlugin();

      expect(typeof plugin.install).toBe('function');
    });
  });

  describe('install', () => {
    it('should not throw on install', () => {
      const plugin = jsonParserPlugin();
      const mockKernel = { context: {} };

      expect(() => plugin.install(mockKernel as any)).not.toThrow();
    });
  });
});

describe('envParserPlugin', () => {
  describe('plugin interface', () => {
    it('should have correct name and version', () => {
      const plugin = envParserPlugin();

      expect(plugin.name).toBe('env-parser');
      expect(plugin.version).toBe('1.0.0');
    });

    it('should have install function', () => {
      const plugin = envParserPlugin();

      expect(typeof plugin.install).toBe('function');
    });
  });

  describe('install', () => {
    it('should not throw on install', () => {
      const plugin = envParserPlugin();
      const mockKernel = { context: {} };

      expect(() => plugin.install(mockKernel as any)).not.toThrow();
    });
  });
});
