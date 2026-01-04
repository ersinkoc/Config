/**
 * Tests for TOML parser plugin.
 */

import { describe, it, expect, vi } from 'vitest';
import { tomlParserPlugin } from '../../../../src/plugins/optional/toml-parser.js';
import tomlParser from '../../../../src/plugins/optional/toml-parser.js';
import type { ConfigKernel } from '../../../../src/kernel.js';

describe('tomlParserPlugin', () => {
  describe('plugin properties', () => {
    it('should have correct name', () => {
      const plugin = tomlParserPlugin();
      expect(plugin.name).toBe('toml-parser');
    });

    it('should have correct version', () => {
      const plugin = tomlParserPlugin();
      expect(plugin.version).toBe('1.0.0');
    });
  });

  describe('install', () => {
    it('should install without error', () => {
      const plugin = tomlParserPlugin();
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      expect(() => plugin.install(mockKernel)).not.toThrow();
    });

    it('should return undefined from install', () => {
      const plugin = tomlParserPlugin();
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      const result = plugin.install(mockKernel);
      expect(result).toBeUndefined();
    });
  });

  describe('default export', () => {
    it('should export a plugin instance', () => {
      expect(tomlParser).toBeDefined();
      expect(tomlParser.name).toBe('toml-parser');
      expect(tomlParser.version).toBe('1.0.0');
    });
  });

  describe('factory function', () => {
    it('should return new plugin instance each time', () => {
      const plugin1 = tomlParserPlugin();
      const plugin2 = tomlParserPlugin();
      expect(plugin1).not.toBe(plugin2);
      expect(plugin1.name).toBe(plugin2.name);
    });
  });
});
