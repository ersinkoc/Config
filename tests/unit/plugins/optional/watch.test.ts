/**
 * Tests for watch plugin.
 */

import { describe, it, expect, vi } from 'vitest';
import { watchPlugin } from '../../../../src/plugins/optional/watch.js';
import watch from '../../../../src/plugins/optional/watch.js';
import type { ConfigKernel } from '../../../../src/kernel.js';

describe('watchPlugin', () => {
  describe('plugin properties', () => {
    it('should have correct name', () => {
      const plugin = watchPlugin();
      expect(plugin.name).toBe('watch');
    });

    it('should have correct version', () => {
      const plugin = watchPlugin();
      expect(plugin.version).toBe('1.0.0');
    });
  });

  describe('install', () => {
    it('should install without error', () => {
      const plugin = watchPlugin();
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      expect(() => plugin.install(mockKernel)).not.toThrow();
    });

    it('should return undefined from install', () => {
      const plugin = watchPlugin();
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      const result = plugin.install(mockKernel);
      expect(result).toBeUndefined();
    });
  });

  describe('default export', () => {
    it('should export a plugin instance', () => {
      expect(watch).toBeDefined();
      expect(watch.name).toBe('watch');
      expect(watch.version).toBe('1.0.0');
    });
  });

  describe('factory function', () => {
    it('should return new plugin instance each time', () => {
      const plugin1 = watchPlugin();
      const plugin2 = watchPlugin();
      expect(plugin1).not.toBe(plugin2);
      expect(plugin1.name).toBe(plugin2.name);
    });
  });
});
