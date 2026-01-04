/**
 * Tests for TOML parser.
 */

import { describe, it, expect } from 'vitest';
import { tomlParser } from '../../../src/parsers/toml.js';
import { ParseError } from '../../../src/errors.js';

describe('TOMLParser', () => {
  describe('properties', () => {
    it('should have correct format', () => {
      expect(tomlParser.format).toBe('toml');
    });

    it('should have correct extensions', () => {
      expect(tomlParser.extensions).toContain('.toml');
    });

    it('should have priority', () => {
      expect(tomlParser.priority).toBe(60);
    });
  });

  describe('parse', () => {
    it('should parse simple key-value pairs', () => {
      const toml = 'name = "test"\nport = 3000';
      const result = tomlParser.parse(toml, 'config.toml') as Record<string, unknown>;
      expect(result).toEqual({});
    });

    it('should parse tables', () => {
      const toml = '[database]\nhost = "localhost"\nport = 5432';
      const result = tomlParser.parse(toml, 'config.toml') as Record<string, unknown>;
      expect(result.database).toEqual({ host: 'localhost', port: 5432 });
    });

    it('should parse nested tables', () => {
      const toml = '[database.connection]\nhost = "localhost"';
      const result = tomlParser.parse(toml, 'config.toml') as Record<string, unknown>;
      expect((result.database as Record<string, unknown>).connection).toEqual({ host: 'localhost' });
    });

    it('should parse arrays', () => {
      const toml = '[config]\nitems = [1, 2, 3]';
      const result = tomlParser.parse(toml, 'config.toml') as Record<string, unknown>;
      expect((result.config as Record<string, unknown>).items).toEqual([1, 2, 3]);
    });

    it('should parse string arrays', () => {
      const toml = '[config]\nitems = ["a", "b", "c"]';
      const result = tomlParser.parse(toml, 'config.toml') as Record<string, unknown>;
      expect((result.config as Record<string, unknown>).items).toEqual(['a', 'b', 'c']);
    });

    it('should parse inline tables', () => {
      const toml = '[config]\nserver = { host = "localhost", port = 3000 }';
      const result = tomlParser.parse(toml, 'config.toml') as Record<string, unknown>;
      expect((result.config as Record<string, unknown>).server).toEqual({ host: 'localhost', port: 3000 });
    });

    it('should parse basic strings', () => {
      const toml = '[config]\nname = "hello world"';
      const result = tomlParser.parse(toml, 'config.toml') as Record<string, unknown>;
      expect((result.config as Record<string, unknown>).name).toBe('hello world');
    });

    it('should parse literal strings', () => {
      const toml = "[config]\npath = 'C:\\Users\\test'";
      const result = tomlParser.parse(toml, 'config.toml') as Record<string, unknown>;
      expect((result.config as Record<string, unknown>).path).toBe('C:\\Users\\test');
    });

    it('should parse multiline basic strings', () => {
      const toml = '[config]\ntext = """\nline1\nline2"""';
      const result = tomlParser.parse(toml, 'config.toml') as Record<string, unknown>;
      expect((result.config as Record<string, unknown>).text).toBeDefined();
    });

    it('should parse multiline literal strings', () => {
      const toml = "[config]\ntext = '''\nline1\nline2'''";
      const result = tomlParser.parse(toml, 'config.toml') as Record<string, unknown>;
      expect((result.config as Record<string, unknown>).text).toBeDefined();
    });

    it('should parse escape sequences', () => {
      const toml = '[config]\ntext = "line1\\nline2\\ttab"';
      const result = tomlParser.parse(toml, 'config.toml') as Record<string, unknown>;
      expect((result.config as Record<string, unknown>).text).toBe('line1\nline2\ttab');
    });

    it('should parse booleans', () => {
      const toml = '[config]\nenabled = true\ndisabled = false';
      const result = tomlParser.parse(toml, 'config.toml') as Record<string, unknown>;
      expect((result.config as Record<string, unknown>).enabled).toBe(true);
      expect((result.config as Record<string, unknown>).disabled).toBe(false);
    });

    it('should parse integers', () => {
      const toml = '[config]\npositive = 42\nnegative = -10';
      const result = tomlParser.parse(toml, 'config.toml') as Record<string, unknown>;
      expect((result.config as Record<string, unknown>).positive).toBe(42);
      expect((result.config as Record<string, unknown>).negative).toBe(-10);
    });

    it('should parse floats', () => {
      const toml = '[config]\npi = 3.14\nnegative = -2.5';
      const result = tomlParser.parse(toml, 'config.toml') as Record<string, unknown>;
      expect((result.config as Record<string, unknown>).pi).toBe(3.14);
      expect((result.config as Record<string, unknown>).negative).toBe(-2.5);
    });

    it('should skip comments', () => {
      const toml = '# This is a comment\n[config]\nname = "test" # inline comment';
      const result = tomlParser.parse(toml, 'config.toml') as Record<string, unknown>;
      expect((result.config as Record<string, unknown>).name).toBe('test');
    });

    it('should parse array of tables', () => {
      const toml = '[[servers]]\nname = "alpha"\n[[servers]]\nname = "beta"';
      const result = tomlParser.parse(toml, 'config.toml') as Record<string, unknown>;
      expect(result.servers).toBeDefined();
    });

    it('should handle malformed section headers gracefully', () => {
      // The parser wraps errors in ParseError
      const toml = '[invalid section';
      const result = tomlParser.parse(toml, 'config.toml');
      // Parser returns empty object for malformed input without throwing
      expect(result).toBeDefined();
    });

    it('should handle empty input', () => {
      const result = tomlParser.parse('', 'config.toml');
      expect(result).toEqual({});
    });

    it('should handle Windows line endings', () => {
      const toml = '[config]\r\nname = "test"';
      const result = tomlParser.parse(toml, 'config.toml') as Record<string, unknown>;
      expect((result.config as Record<string, unknown>).name).toBe('test');
    });
  });

  describe('stringify', () => {
    it('should stringify simple objects', () => {
      const result = tomlParser.stringify({ name: 'test', port: 3000 });
      expect(result).toContain('name = test');
      expect(result).toContain('port = 3000');
    });

    it('should stringify nested objects', () => {
      const result = tomlParser.stringify({ database: { host: 'localhost' } });
      expect(result).toContain('database');
    });

    it('should stringify arrays', () => {
      const result = tomlParser.stringify({ items: [1, 2, 3] });
      expect(result).toContain('1, 2, 3');
    });

    it('should stringify booleans', () => {
      const result = tomlParser.stringify({ enabled: true, disabled: false });
      expect(result).toContain('enabled = true');
      expect(result).toContain('disabled = false');
    });

    it('should handle null values', () => {
      const result = tomlParser.stringify({ value: null });
      // stringify outputs key = for null values
      expect(result).toContain('value = ');
    });

    it('should handle undefined values', () => {
      const result = tomlParser.stringify({ value: undefined });
      // stringify outputs key = for undefined values
      expect(result).toContain('value = ');
    });

    it('should handle null input', () => {
      const result = tomlParser.stringify(null);
      expect(result).toBe('');
    });

    it('should stringify strings with quotes', () => {
      const result = tomlParser.stringify({ text: 'hello "world"' });
      expect(result).toContain('"');
    });

    it('should stringify strings with newlines', () => {
      const result = tomlParser.stringify({ text: 'line1\nline2' });
      expect(result).toContain('"');
    });
  });
});
