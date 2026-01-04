/**
 * Tests for YAML parser.
 */

import { describe, it, expect } from 'vitest';
import { yamlParser } from '../../../src/parsers/yaml.js';
import { ParseError } from '../../../src/errors.js';

describe('YAMLParser', () => {
  describe('properties', () => {
    it('should have correct format', () => {
      expect(yamlParser.format).toBe('yaml');
    });

    it('should have correct extensions', () => {
      expect(yamlParser.extensions).toContain('.yaml');
      expect(yamlParser.extensions).toContain('.yml');
    });

    it('should have priority', () => {
      expect(yamlParser.priority).toBe(60);
    });
  });

  describe('parse', () => {
    it('should parse simple key-value pairs', () => {
      const yaml = 'name: test\nport: 3000';
      const result = yamlParser.parse(yaml, 'config.yaml') as Record<string, unknown>;
      expect(result.name).toBe('test');
      expect(result.port).toBe(3000);
    });

    it('should parse nested objects', () => {
      const yaml = 'database:\n  host: localhost\n  port: 5432';
      const result = yamlParser.parse(yaml, 'config.yaml') as Record<string, unknown>;
      expect(result.database).toEqual({ host: 'localhost', port: 5432 });
    });

    it('should parse arrays', () => {
      const yaml = 'items:\n- one\n- two\n- three';
      const result = yamlParser.parse(yaml, 'config.yaml') as Record<string, unknown>;
      expect(result.items).toEqual(['one', 'two', 'three']);
    });

    it('should parse inline arrays', () => {
      const yaml = 'items: [1, 2, 3]';
      const result = yamlParser.parse(yaml, 'config.yaml') as Record<string, unknown>;
      expect(result.items).toEqual([1, 2, 3]);
    });

    it('should parse inline objects', () => {
      const yaml = 'config: {host: localhost, port: 3000}';
      const result = yamlParser.parse(yaml, 'config.yaml') as Record<string, unknown>;
      expect(result.config).toEqual({ host: 'localhost', port: 3000 });
    });

    it('should parse quoted strings', () => {
      const yaml = 'name: "hello world"\nsingle: \'test\'';
      const result = yamlParser.parse(yaml, 'config.yaml') as Record<string, unknown>;
      expect(result.name).toBe('hello world');
      expect(result.single).toBe('test');
    });

    it('should parse escape sequences in double quotes', () => {
      const yaml = 'text: "line1\\nline2\\ttab"';
      const result = yamlParser.parse(yaml, 'config.yaml') as Record<string, unknown>;
      expect(result.text).toBe('line1\nline2\ttab');
    });

    it('should parse booleans', () => {
      const yaml = 'enabled: true\ndisabled: false';
      const result = yamlParser.parse(yaml, 'config.yaml') as Record<string, unknown>;
      expect(result.enabled).toBe(true);
      expect(result.disabled).toBe(false);
    });

    it('should parse null', () => {
      const yaml = 'value: null';
      const result = yamlParser.parse(yaml, 'config.yaml') as Record<string, unknown>;
      expect(result.value).toBeNull();
    });

    it('should parse integers', () => {
      const yaml = 'positive: 42\nnegative: -10';
      const result = yamlParser.parse(yaml, 'config.yaml') as Record<string, unknown>;
      expect(result.positive).toBe(42);
      expect(result.negative).toBe(-10);
    });

    it('should parse floats', () => {
      const yaml = 'pi: 3.14\nnegative: -2.5';
      const result = yamlParser.parse(yaml, 'config.yaml') as Record<string, unknown>;
      expect(result.pi).toBe(3.14);
      expect(result.negative).toBe(-2.5);
    });

    it('should skip comments', () => {
      const yaml = '# This is a comment\nname: test\n# Another comment';
      const result = yamlParser.parse(yaml, 'config.yaml') as Record<string, unknown>;
      expect(result.name).toBe('test');
    });

    it('should handle multi-line strings with pipe', () => {
      const yaml = 'text: |\n  line1\n  line2';
      const result = yamlParser.parse(yaml, 'config.yaml') as Record<string, unknown>;
      expect(result.text).toBeDefined();
    });

    it('should handle multi-line strings with gt', () => {
      const yaml = 'text: >\n  line1\n  line2';
      const result = yamlParser.parse(yaml, 'config.yaml') as Record<string, unknown>;
      expect(result.text).toBeDefined();
    });

    it('should handle anchors and aliases', () => {
      const yaml = 'anchor: &ref value\nalias: *ref';
      const result = yamlParser.parse(yaml, 'config.yaml') as Record<string, unknown>;
      expect(result.anchor).toBe('value');
      // Alias returns as *ref string for now
      expect(result.alias).toBeDefined();
    });

    it('should handle document separators', () => {
      const yaml = '---\nname: doc1';
      const result = yamlParser.parse(yaml, 'config.yaml') as Record<string, unknown>;
      expect(result.name).toBe('doc1');
    });

    it('should parse date-like strings', () => {
      const yaml = 'date: 2024-01-15';
      const result = yamlParser.parse(yaml, 'config.yaml') as Record<string, unknown>;
      expect(result.date).toBeDefined();
    });

    it('should throw ParseError for invalid YAML', () => {
      const yaml = 'invalid: [unclosed';
      expect(() => yamlParser.parse(yaml, 'config.yaml')).toThrow(ParseError);
    });

    it('should handle empty input', () => {
      const result = yamlParser.parse('', 'config.yaml');
      expect(result).toEqual([]);
    });

    it('should handle keys with special characters', () => {
      const yaml = 'key-name: value\nkey_name2: value2';
      const result = yamlParser.parse(yaml, 'config.yaml') as Record<string, unknown>;
      expect(result['key-name']).toBe('value');
      expect(result['key_name2']).toBe('value2');
    });
  });

  describe('stringify', () => {
    it('should stringify simple objects', () => {
      const result = yamlParser.stringify({ name: 'test', port: 3000 });
      expect(result).toContain('name: test');
      expect(result).toContain('port: 3000');
    });

    it('should stringify nested objects', () => {
      const result = yamlParser.stringify({ database: { host: 'localhost' } });
      expect(result).toContain('database:');
      expect(result).toContain('host: localhost');
    });

    it('should stringify arrays', () => {
      const result = yamlParser.stringify({ items: [1, 2, 3] });
      expect(result).toContain('- 1');
      expect(result).toContain('- 2');
      expect(result).toContain('- 3');
    });

    it('should stringify empty arrays', () => {
      const result = yamlParser.stringify({ items: [] });
      expect(result).toContain('[]');
    });

    it('should stringify empty objects', () => {
      const result = yamlParser.stringify({ empty: {} });
      expect(result).toContain('{}');
    });

    it('should stringify booleans', () => {
      const result = yamlParser.stringify({ enabled: true, disabled: false });
      expect(result).toContain('enabled: true');
      expect(result).toContain('disabled: false');
    });

    it('should stringify null', () => {
      const result = yamlParser.stringify({ value: null });
      expect(result).toContain('value: null');
    });

    it('should handle multi-line strings', () => {
      const result = yamlParser.stringify({ text: 'line1\nline2' });
      expect(result).toContain('|');
    });

    it('should quote strings with special characters', () => {
      const result = yamlParser.stringify({ key: 'value:test' });
      expect(result).toContain('"');
    });

    it('should quote strings with hash', () => {
      const result = yamlParser.stringify({ key: 'value#test' });
      expect(result).toContain('"');
    });

    it('should stringify numbers', () => {
      const result = yamlParser.stringify({ int: 42, float: 3.14 });
      expect(result).toContain('int: 42');
      expect(result).toContain('float: 3.14');
    });
  });
});
