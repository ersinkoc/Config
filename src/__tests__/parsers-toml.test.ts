// @ts-nocheck
/**
 * Tests for parsers/toml.ts
 */

import { tomlParser } from '../parsers/toml.js';
import { ParseError } from '../errors.js';

describe('tomlParser', () => {
  describe('parser interface', () => {
    it('should have correct format', () => {
      expect(tomlParser.format).toBe('toml');
    });

    it('should have correct extensions', () => {
      expect(tomlParser.extensions).toEqual(['.toml']);
    });

    it('should have priority', () => {
      expect(typeof tomlParser.priority).toBe('number');
    });
  });

  describe('parse', () => {
    it('should parse tables', () => {
      const toml = `
[database]
host = "localhost"
port = 5432
`;
      const result = tomlParser.parse(toml, 'config.toml');

      expect(result).toEqual({
        database: {
          host: 'localhost',
          port: 5432,
        },
      });
    });

    it('should parse nested tables with dot notation', () => {
      const toml = `
[database.primary]
host = "localhost"
[database.replica]
host = "replica.local"
`;
      const result = tomlParser.parse(toml, 'config.toml');

      expect(result).toEqual({
        database: {
          primary: { host: 'localhost' },
          replica: { host: 'replica.local' },
        },
      });
    });

    it('should handle empty content', () => {
      const result = tomlParser.parse('', 'config.toml');
      expect(result).toEqual({});
    });

    it('should throw ParseError for invalid TOML', () => {
      const toml = 'key = [invalid';

      expect(() => tomlParser.parse(toml, 'config.toml')).toThrow(ParseError);
    });

    it('should include file info in ParseError', () => {
      const toml = 'invalid = [';

      try {
        tomlParser.parse(toml, 'test.toml');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        expect((error as ParseError).file).toBe('test.toml');
      }
    });
  });

  describe('stringify', () => {
    it('should stringify simple object', () => {
      const obj = { name: 'test', value: 42 };
      const result = tomlParser.stringify(obj);

      expect(result).toContain('name =');
      expect(result).toContain('value = 42');
    });

    it('should stringify nested objects', () => {
      const obj = { database: { host: 'localhost', port: 5432 } };
      const result = tomlParser.stringify(obj);

      expect(result).toContain('database =');
      expect(result).toContain('host =');
      expect(result).toContain('port = 5432');
    });

    it('should stringify arrays', () => {
      const obj = { items: [1, 2, 3] };
      const result = tomlParser.stringify(obj);

      expect(result).toContain('items =');
    });

    it('should stringify boolean values', () => {
      const obj = { enabled: true, disabled: false };
      const result = tomlParser.stringify(obj);

      expect(result).toContain('enabled = true');
      expect(result).toContain('disabled = false');
    });

    it('should handle null input', () => {
      expect(tomlParser.stringify(null)).toBe('');
    });

    it('should handle undefined input', () => {
      expect(tomlParser.stringify(undefined)).toBe('');
    });

    it('should handle empty object', () => {
      const result = tomlParser.stringify({});
      expect(result).toBe('');
    });

    it('should stringify Date objects', () => {
      const obj = { date: new Date('2024-01-01T00:00:00Z') };
      const result = tomlParser.stringify(obj);

      expect(result).toContain('date =');
    });

    it('should handle strings with quotes', () => {
      const obj = { message: 'He said "hello"' };
      const result = tomlParser.stringify(obj);

      expect(result).toContain('message =');
    });

    it('should handle strings with newlines', () => {
      const obj = { text: 'line1\nline2' };
      const result = tomlParser.stringify(obj);

      expect(result).toContain('text =');
    });
  });
});
