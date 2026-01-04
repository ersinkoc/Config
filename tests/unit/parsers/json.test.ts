/**
 * Tests for JSON parser.
 */

import { describe, it, expect } from 'vitest';
import { jsonParser } from '../../../src/parsers/json.js';
import { ParseError } from '../../../src/errors.js';

describe('JSONParser', () => {
  describe('properties', () => {
    it('should have correct format', () => {
      expect(jsonParser.format).toBe('json');
    });

    it('should have correct extensions', () => {
      expect(jsonParser.extensions).toContain('.json');
    });

    it('should have priority', () => {
      expect(jsonParser.priority).toBe(50);
    });
  });

  describe('parse', () => {
    it('should parse valid JSON', () => {
      const result = jsonParser.parse('{"name": "test", "value": 123}', 'config.json');
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should parse arrays', () => {
      const result = jsonParser.parse('[1, 2, 3]', 'config.json');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should parse nested objects', () => {
      const json = '{"a": {"b": {"c": "deep"}}}';
      const result = jsonParser.parse(json, 'config.json');
      expect(result).toEqual({ a: { b: { c: 'deep' } } });
    });

    it('should parse all JSON types', () => {
      const json = '{"string": "hello", "number": 42, "boolean": true, "null": null, "array": [1, 2], "object": {"key": "value"}}';
      const result = jsonParser.parse(json, 'config.json') as Record<string, unknown>;

      expect(result.string).toBe('hello');
      expect(result.number).toBe(42);
      expect(result.boolean).toBe(true);
      expect(result.null).toBeNull();
      expect(result.array).toEqual([1, 2]);
      expect(result.object).toEqual({ key: 'value' });
    });

    it('should throw ParseError for invalid JSON', () => {
      expect(() => jsonParser.parse('{invalid}', 'config.json')).toThrow(ParseError);
    });

    it('should include file info for position errors', () => {
      // This JSON has an error at a specific position
      const invalidJson = '{"name": "test", "value": }';
      try {
        jsonParser.parse(invalidJson, 'config.json');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        const parseError = error as ParseError;
        expect(parseError.file).toBe('config.json');
        // The error includes the file path - line/column may not be present
        // depending on the JSON parse error message format
      }
    });

    it('should handle JSON errors without position info', () => {
      // Create an error that doesn't have position info
      try {
        jsonParser.parse('not json at all {{{', 'config.json');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        const parseError = error as ParseError;
        expect(parseError.file).toBe('config.json');
      }
    });

    it('should handle empty object', () => {
      const result = jsonParser.parse('{}', 'config.json');
      expect(result).toEqual({});
    });

    it('should handle empty array', () => {
      const result = jsonParser.parse('[]', 'config.json');
      expect(result).toEqual([]);
    });

    it('should throw for empty string', () => {
      expect(() => jsonParser.parse('', 'config.json')).toThrow(ParseError);
    });

    it('should parse multiline JSON with position error', () => {
      const json = `{
  "name": "test",
  "value": invalid
}`;
      try {
        jsonParser.parse(json, 'config.json');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
      }
    });
  });

  describe('stringify', () => {
    it('should stringify object', () => {
      const result = jsonParser.stringify({ name: 'test' });
      expect(JSON.parse(result)).toEqual({ name: 'test' });
    });

    it('should stringify with indentation', () => {
      const result = jsonParser.stringify({ name: 'test' });
      expect(result).toContain('\n');
      expect(result).toContain('  ');
    });

    it('should stringify arrays', () => {
      const result = jsonParser.stringify([1, 2, 3]);
      expect(JSON.parse(result)).toEqual([1, 2, 3]);
    });

    it('should stringify nested objects', () => {
      const obj = { a: { b: { c: 'deep' } } };
      const result = jsonParser.stringify(obj);
      expect(JSON.parse(result)).toEqual(obj);
    });

    it('should stringify null', () => {
      const result = jsonParser.stringify(null);
      expect(result).toBe('null');
    });

    it('should stringify primitives', () => {
      expect(jsonParser.stringify(42)).toBe('42');
      expect(jsonParser.stringify('hello')).toBe('"hello"');
      expect(jsonParser.stringify(true)).toBe('true');
    });
  });
});
