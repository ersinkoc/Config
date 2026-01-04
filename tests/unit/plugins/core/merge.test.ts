/**
 * Tests for merge plugin.
 */

import { describe, it, expect, vi } from 'vitest';
import { mergePlugin } from '../../../../src/plugins/core/merge.js';
import merge from '../../../../src/plugins/core/merge.js';
import type { ConfigKernel } from '../../../../src/kernel.js';

describe('mergePlugin', () => {
  describe('plugin properties', () => {
    it('should have correct name', () => {
      const plugin = mergePlugin();
      expect(plugin.name).toBe('merge');
    });

    it('should have correct version', () => {
      const plugin = mergePlugin();
      expect(plugin.version).toBe('1.0.0');
    });
  });

  describe('install', () => {
    it('should install without error', () => {
      const plugin = mergePlugin();
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      expect(() => plugin.install(mockKernel)).not.toThrow();
    });

    it('should store default strategies in kernel context', () => {
      const plugin = mergePlugin();
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      plugin.install(mockKernel);
      expect((mockKernel.context as any).mergeStrategies).toEqual({
        default: 'merge',
        arrays: 'replace',
      });
    });

    it('should store custom strategies in kernel context', () => {
      const plugin = mergePlugin({
        default: 'replace',
        arrays: 'unique',
      });
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      plugin.install(mockKernel);
      expect((mockKernel.context as any).mergeStrategies).toEqual({
        default: 'replace',
        arrays: 'unique',
      });
    });

    it('should handle partial strategy options', () => {
      const plugin = mergePlugin({
        default: 'merge',
      });
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      plugin.install(mockKernel);
      expect((mockKernel.context as any).mergeStrategies.default).toBe('merge');
    });
  });

  describe('onAfterMerge', () => {
    it('should return config unchanged', () => {
      const plugin = mergePlugin();
      const config = { port: 3000, host: 'localhost' };

      const result = plugin.onAfterMerge!(config);
      expect(result).toBe(config);
    });

    it('should handle complex config objects', () => {
      const plugin = mergePlugin();
      const config = {
        database: { host: 'localhost', port: 5432 },
        items: [1, 2, 3],
      };

      const result = plugin.onAfterMerge!(config);
      expect(result).toEqual(config);
    });

    it('should handle null config', () => {
      const plugin = mergePlugin();
      const result = plugin.onAfterMerge!(null);
      expect(result).toBeNull();
    });
  });

  describe('default export', () => {
    it('should export a plugin instance', () => {
      expect(merge).toBeDefined();
      expect(merge.name).toBe('merge');
      expect(merge.version).toBe('1.0.0');
    });
  });

  describe('factory function', () => {
    it('should return new plugin instance each time', () => {
      const plugin1 = mergePlugin();
      const plugin2 = mergePlugin();
      expect(plugin1).not.toBe(plugin2);
      expect(plugin1.name).toBe(plugin2.name);
    });

    it('should accept path-specific strategies', () => {
      const plugin = mergePlugin({
        paths: {
          'database.host': 'replace',
          'settings.theme': 'merge',
        },
      });
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      plugin.install(mockKernel);
      expect((mockKernel.context as any).mergeStrategies.paths).toBeDefined();
    });
  });
});
