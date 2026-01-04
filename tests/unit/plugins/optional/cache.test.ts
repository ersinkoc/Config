/**
 * Tests for cache plugin.
 */

import { describe, it, expect, vi } from 'vitest';
import { cachePlugin } from '../../../../src/plugins/optional/cache.js';
import cache from '../../../../src/plugins/optional/cache.js';
import type { ConfigKernel } from '../../../../src/kernel.js';

describe('cachePlugin', () => {
  describe('plugin properties', () => {
    it('should have correct name', () => {
      const plugin = cachePlugin({});
      expect(plugin.name).toBe('cache');
    });

    it('should have correct version', () => {
      const plugin = cachePlugin({});
      expect(plugin.version).toBe('1.0.0');
    });
  });

  describe('install', () => {
    it('should install without error', () => {
      const plugin = cachePlugin({});
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      expect(() => plugin.install(mockKernel)).not.toThrow();
    });

    it('should return undefined from install', () => {
      const plugin = cachePlugin({});
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      const result = plugin.install(mockKernel);
      expect(result).toBeUndefined();
    });

    it('should accept custom TTL', () => {
      const plugin = cachePlugin({ ttl: 60000 });
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      expect(() => plugin.install(mockKernel)).not.toThrow();
    });

    it('should accept undefined TTL', () => {
      const plugin = cachePlugin({ ttl: undefined });
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      expect(() => plugin.install(mockKernel)).not.toThrow();
    });
  });

  describe('default export', () => {
    it('should export a plugin instance', () => {
      expect(cache).toBeDefined();
      expect(cache.name).toBe('cache');
      expect(cache.version).toBe('1.0.0');
    });
  });

  describe('factory function', () => {
    it('should return new plugin instance each time', () => {
      const plugin1 = cachePlugin({});
      const plugin2 = cachePlugin({});
      expect(plugin1).not.toBe(plugin2);
      expect(plugin1.name).toBe(plugin2.name);
    });

    it('should accept various TTL values', () => {
      expect(() => cachePlugin({ ttl: 0 })).not.toThrow();
      expect(() => cachePlugin({ ttl: 1000 })).not.toThrow();
      expect(() => cachePlugin({ ttl: 3600000 })).not.toThrow();
    });
  });
});
