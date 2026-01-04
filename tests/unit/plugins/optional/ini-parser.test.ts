/**
 * Tests for INI parser plugin.
 */

import { describe, it, expect, vi } from 'vitest';
import { iniParserPlugin } from '../../../../src/plugins/optional/ini-parser.js';
import iniParser from '../../../../src/plugins/optional/ini-parser.js';
import type { ConfigKernel } from '../../../../src/kernel.js';

describe('iniParserPlugin', () => {
  describe('plugin properties', () => {
    it('should have correct name', () => {
      const plugin = iniParserPlugin();
      expect(plugin.name).toBe('ini-parser');
    });

    it('should have correct version', () => {
      const plugin = iniParserPlugin();
      expect(plugin.version).toBe('1.0.0');
    });
  });

  describe('install', () => {
    it('should install without error', () => {
      const plugin = iniParserPlugin();
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      expect(() => plugin.install(mockKernel)).not.toThrow();
    });

    it('should return undefined from install', () => {
      const plugin = iniParserPlugin();
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      const result = plugin.install(mockKernel);
      expect(result).toBeUndefined();
    });
  });

  describe('default export', () => {
    it('should export a plugin instance', () => {
      expect(iniParser).toBeDefined();
      expect(iniParser.name).toBe('ini-parser');
      expect(iniParser.version).toBe('1.0.0');
    });
  });

  describe('factory function', () => {
    it('should return new plugin instance each time', () => {
      const plugin1 = iniParserPlugin();
      const plugin2 = iniParserPlugin();
      expect(plugin1).not.toBe(plugin2);
      expect(plugin1.name).toBe(plugin2.name);
    });
  });
});
