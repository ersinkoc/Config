/**
 * Tests for YAML parser plugin.
 */

import { describe, it, expect, vi } from 'vitest';
import { yamlParserPlugin } from '../../../../src/plugins/optional/yaml-parser.js';
import yamlParser from '../../../../src/plugins/optional/yaml-parser.js';
import type { ConfigKernel } from '../../../../src/kernel.js';

describe('yamlParserPlugin', () => {
  describe('plugin properties', () => {
    it('should have correct name', () => {
      const plugin = yamlParserPlugin();
      expect(plugin.name).toBe('yaml-parser');
    });

    it('should have correct version', () => {
      const plugin = yamlParserPlugin();
      expect(plugin.version).toBe('1.0.0');
    });
  });

  describe('install', () => {
    it('should install without error', () => {
      const plugin = yamlParserPlugin();
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      expect(() => plugin.install(mockKernel)).not.toThrow();
    });

    it('should return undefined from install', () => {
      const plugin = yamlParserPlugin();
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      const result = plugin.install(mockKernel);
      expect(result).toBeUndefined();
    });
  });

  describe('default export', () => {
    it('should export a plugin instance', () => {
      expect(yamlParser).toBeDefined();
      expect(yamlParser.name).toBe('yaml-parser');
      expect(yamlParser.version).toBe('1.0.0');
    });
  });

  describe('factory function', () => {
    it('should return new plugin instance each time', () => {
      const plugin1 = yamlParserPlugin();
      const plugin2 = yamlParserPlugin();
      expect(plugin1).not.toBe(plugin2);
      expect(plugin1.name).toBe(plugin2.name);
    });
  });
});
