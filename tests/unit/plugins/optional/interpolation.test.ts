/**
 * Tests for interpolation plugin.
 */

import { describe, it, expect, vi } from 'vitest';
import { interpolationPlugin } from '../../../../src/plugins/optional/interpolation.js';
import interpolation from '../../../../src/plugins/optional/interpolation.js';
import type { ConfigKernel } from '../../../../src/kernel.js';

describe('interpolationPlugin', () => {
  describe('plugin properties', () => {
    it('should have correct name', () => {
      const plugin = interpolationPlugin();
      expect(plugin.name).toBe('interpolation');
    });

    it('should have correct version', () => {
      const plugin = interpolationPlugin();
      expect(plugin.version).toBe('1.0.0');
    });
  });

  describe('install', () => {
    it('should install without error', () => {
      const plugin = interpolationPlugin();
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      expect(() => plugin.install(mockKernel)).not.toThrow();
    });

    it('should return undefined from install', () => {
      const plugin = interpolationPlugin();
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      const result = plugin.install(mockKernel);
      expect(result).toBeUndefined();
    });
  });

  describe('default export', () => {
    it('should export a plugin instance', () => {
      expect(interpolation).toBeDefined();
      expect(interpolation.name).toBe('interpolation');
      expect(interpolation.version).toBe('1.0.0');
    });
  });

  describe('factory function', () => {
    it('should return new plugin instance each time', () => {
      const plugin1 = interpolationPlugin();
      const plugin2 = interpolationPlugin();
      expect(plugin1).not.toBe(plugin2);
      expect(plugin1.name).toBe(plugin2.name);
    });
  });
});
