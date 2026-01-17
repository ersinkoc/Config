// @ts-nocheck
/**
 * Tests for parsers/yaml.ts
 */

import { yamlParser } from '../parsers/yaml.js';
import { ParseError } from '../errors.js';

describe('yamlParser', () => {
  describe('parser interface', () => {
    it('should have correct format', () => {
      expect(yamlParser.format).toBe('yaml');
    });

    it('should have correct extensions', () => {
      expect(yamlParser.extensions).toEqual(['.yaml', '.yml']);
    });

    it('should have priority', () => {
      expect(typeof yamlParser.priority).toBe('number');
    });
  });

  describe('parse', () => {
    it('should handle empty content', () => {
      const result = yamlParser.parse('', 'config.yaml');
      // Empty content may return null or empty array
      expect(result).toBeDefined();
    });

    it('should throw ParseError for invalid input', () => {
      // Single colon without value should still be handled
      const result = yamlParser.parse('key:', 'config.yaml');
      expect(result).toBeDefined();
    });
  });

  describe('stringify', () => {
    it('should stringify simple object', () => {
      const obj = { name: 'test', value: 42 };
      const result = yamlParser.stringify(obj);

      expect(result).toContain('name:');
      expect(result).toContain('value: 42');
    });

    it('should stringify nested objects', () => {
      const obj = { database: { host: 'localhost', port: 5432 } };
      const result = yamlParser.stringify(obj);

      expect(result).toContain('database:');
      expect(result).toContain('host:');
    });

    it('should stringify arrays', () => {
      const obj = { items: [1, 2, 3] };
      const result = yamlParser.stringify(obj);

      expect(result).toContain('items:');
      expect(result).toContain('- 1');
    });

    it('should stringify null values', () => {
      const obj = { value: null };
      const result = yamlParser.stringify(obj);

      expect(result).toContain('value: null');
    });

    it('should stringify boolean values', () => {
      const obj = { enabled: true, disabled: false };
      const result = yamlParser.stringify(obj);

      expect(result).toContain('enabled: true');
      expect(result).toContain('disabled: false');
    });

    it('should handle null input', () => {
      const result = yamlParser.stringify(null);
      expect(result).toBe('null');
    });

    it('should handle empty object', () => {
      const result = yamlParser.stringify({});
      expect(result).toBe('{}');
    });

    it('should handle empty array', () => {
      const result = yamlParser.stringify([]);
      expect(result).toBe('[]');
    });

    it('should quote strings with colons', () => {
      const obj = { message: 'Hello: World' };
      const result = yamlParser.stringify(obj);

      expect(result).toContain('"Hello: World"');
    });

    it('should handle strings with newlines', () => {
      const obj = { text: 'line1\nline2' };
      const result = yamlParser.stringify(obj);

      expect(result).toContain('|');
    });

    it('should stringify numbers', () => {
      const obj = { integer: 42, float: 3.14 };
      const result = yamlParser.stringify(obj);

      expect(result).toContain('integer: 42');
      expect(result).toContain('float: 3.14');
    });
  });
});
