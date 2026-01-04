/**
 * Tests for encryption plugin.
 */

import { describe, it, expect, vi } from 'vitest';
import { encryptionPlugin } from '../../../../src/plugins/optional/encryption.js';
import encryption from '../../../../src/plugins/optional/encryption.js';
import type { ConfigKernel } from '../../../../src/kernel.js';

describe('encryptionPlugin', () => {
  describe('plugin properties', () => {
    it('should have correct name', () => {
      const plugin = encryptionPlugin({ key: 'secret' });
      expect(plugin.name).toBe('encryption');
    });

    it('should have correct version', () => {
      const plugin = encryptionPlugin({ key: 'secret' });
      expect(plugin.version).toBe('1.0.0');
    });
  });

  describe('install', () => {
    it('should install without error', () => {
      const plugin = encryptionPlugin({ key: 'secret' });
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      expect(() => plugin.install(mockKernel)).not.toThrow();
    });

    it('should return undefined from install', () => {
      const plugin = encryptionPlugin({ key: 'secret' });
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      const result = plugin.install(mockKernel);
      expect(result).toBeUndefined();
    });

    it('should accept empty key', () => {
      const plugin = encryptionPlugin({ key: '' });
      const mockKernel = {
        context: {},
      } as unknown as ConfigKernel;

      expect(() => plugin.install(mockKernel)).not.toThrow();
    });
  });

  describe('default export', () => {
    it('should export a plugin instance', () => {
      expect(encryption).toBeDefined();
      expect(encryption.name).toBe('encryption');
      expect(encryption.version).toBe('1.0.0');
    });
  });

  describe('factory function', () => {
    it('should return new plugin instance each time', () => {
      const plugin1 = encryptionPlugin({ key: 'secret1' });
      const plugin2 = encryptionPlugin({ key: 'secret2' });
      expect(plugin1).not.toBe(plugin2);
      expect(plugin1.name).toBe(plugin2.name);
    });

    it('should accept various key formats', () => {
      expect(() => encryptionPlugin({ key: 'short' })).not.toThrow();
      expect(() => encryptionPlugin({ key: 'a'.repeat(100) })).not.toThrow();
    });
  });
});
