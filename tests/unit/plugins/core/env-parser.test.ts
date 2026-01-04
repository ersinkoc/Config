/**
 * Tests for ENV parser plugin.
 */

import { describe, it, expect, vi } from 'vitest';
import { envParserPlugin } from '../../../../src/plugins/core/env-parser.js';
import envParser from '../../../../src/plugins/core/env-parser.js';
import type { ConfigKernel } from '../../../../src/kernel.js';

describe('envParserPlugin', () => {
  describe('plugin properties', () => {
    it('should have correct name', () => {
      const plugin = envParserPlugin();
      expect(plugin.name).toBe('env-parser');
    });

    it('should have correct version', () => {
      const plugin = envParserPlugin();
      expect(plugin.version).toBe('1.0.0');
    });
  });

  describe('install', () => {
    it('should install without error', () => {
      const plugin = envParserPlugin();
      const mockKernel = {
        context: {},
        load: vi.fn(),
        cache: { get: vi.fn(), set: vi.fn(), delete: vi.fn(), clear: vi.fn() },
        events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
        watcher: { watch: vi.fn(), unwatch: vi.fn(), unwatchAll: vi.fn() },
        plugins: { register: vi.fn() },
        parser: { parse: vi.fn(), stringify: vi.fn() },
        fs: { readFile: vi.fn(), exists: vi.fn() },
      } as unknown as ConfigKernel;

      expect(() => plugin.install(mockKernel)).not.toThrow();
    });

    it('should return undefined from install', () => {
      const plugin = envParserPlugin();
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      const result = plugin.install(mockKernel);
      expect(result).toBeUndefined();
    });
  });

  describe('default export', () => {
    it('should export a plugin instance', () => {
      expect(envParser).toBeDefined();
      expect(envParser.name).toBe('env-parser');
      expect(envParser.version).toBe('1.0.0');
    });
  });

  describe('factory function', () => {
    it('should return new plugin instance each time', () => {
      const plugin1 = envParserPlugin();
      const plugin2 = envParserPlugin();
      expect(plugin1).not.toBe(plugin2);
      expect(plugin1.name).toBe(plugin2.name);
    });
  });
});
