// @ts-nocheck
/**
 * Tests for parsers/json.ts
 */

import { jsonParser } from '../parsers/json.js';
import { ParseError } from '../errors.js';

describe('jsonParser', () => {
  describe('parser interface', () => {
    it('should have correct format', () => {
      expect(jsonParser.format).toBe('json');
    });

    it('should have correct extensions', () => {
      expect(jsonParser.extensions).toEqual(['.json']);
    });

    it('should have priority', () => {
      expect(jsonParser.priority).toBe(50);
    });
  });

  describe('parse', () => {
    it('should parse simple JSON object', () => {
      const json = '{"name": "test", "value": 42}';
      const result = jsonParser.parse(json, 'config.json');

      expect(result).toEqual({ name: 'test', value: 42 });
    });

    it('should parse nested objects', () => {
      const json = '{"database": {"host": "localhost", "port": 5432}}';
      const result = jsonParser.parse(json, 'config.json');

      expect(result).toEqual({
        database: { host: 'localhost', port: 5432 },
      });
    });

    it('should parse arrays', () => {
      const json = '{"items": [1, 2, 3]}';
      const result = jsonParser.parse(json, 'config.json');

      expect(result).toEqual({ items: [1, 2, 3] });
    });

    it('should parse arrays of objects', () => {
      const json = '{"users": [{"name": "Alice"}, {"name": "Bob"}]}';
      const result = jsonParser.parse(json, 'config.json');

      expect(result).toEqual({
        users: [{ name: 'Alice' }, { name: 'Bob' }],
      });
    });

    it('should parse null values', () => {
      const json = '{"value": null}';
      const result = jsonParser.parse(json, 'config.json');

      expect(result).toEqual({ value: null });
    });

    it('should parse boolean values', () => {
      const json = '{"enabled": true, "disabled": false}';
      const result = jsonParser.parse(json, 'config.json');

      expect(result).toEqual({ enabled: true, disabled: false });
    });

    it('should parse number values', () => {
      const json = '{"integer": 42, "float": 3.14, "negative": -10, "zero": 0}';
      const result = jsonParser.parse(json, 'config.json');

      expect(result).toEqual({
        integer: 42,
        float: 3.14,
        negative: -10,
        zero: 0,
      });
    });

    it('should parse string values', () => {
      const json = '{"text": "hello", "empty": ""}';
      const result = jsonParser.parse(json, 'config.json');

      expect(result).toEqual({ text: 'hello', empty: '' });
    });

    it('should parse empty object', () => {
      const json = '{}';
      const result = jsonParser.parse(json, 'config.json');

      expect(result).toEqual({});
    });

    it('should parse complex nested structure', () => {
      const json = `{
        "server": {
          "port": 3000,
          "host": "localhost",
          "ssl": {
            "enabled": true,
            "cert": "/path/to/cert"
          }
        },
        "features": ["auth", "logging", "cache"]
      }`;

      const result = jsonParser.parse(json, 'config.json');

      expect(result).toMatchObject({
        server: {
          port: 3000,
          host: 'localhost',
          ssl: {
            enabled: true,
            cert: '/path/to/cert',
          },
        },
        features: ['auth', 'logging', 'cache'],
      });
    });

    it('should parse strings with escaped characters', () => {
      const json = '{"text": "Line 1\\nLine 2\\tTabbed"}';
      const result = jsonParser.parse(json, 'config.json');

      expect(result).toEqual({ text: 'Line 1\nLine 2\tTabbed' });
    });

    it('should parse unicode strings', () => {
      const json = '{"emoji": "🔐", "chinese": "世界"}';
      const result = jsonParser.parse(json, 'config.json');

      expect(result).toEqual({ emoji: '🔐', chinese: '世界' });
    });

    it('should throw ParseError for invalid JSON', () => {
      const json = '{"invalid": }';

      expect(() => jsonParser.parse(json, 'config.json')).toThrow(ParseError);
    });

    it('should throw ParseError with file info', () => {
      const json = '{broken json}';

      try {
        jsonParser.parse(json, 'test.json');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        expect((error as ParseError).file).toBe('test.json');
      }
    });

    it('should throw ParseError with position info when available', () => {
      const json = '{"name": "test", invalid}';

      try {
        jsonParser.parse(json, 'test.json');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        expect((error as ParseError).message).toContain('Invalid JSON');
      }
    });

    it('should throw ParseError with line and column when position is in message', () => {
      const json = '{"key": "value", trailing}';

      try {
        jsonParser.parse(json, 'test.json');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        const err = error as ParseError;
        expect(err.file).toBeDefined();
        expect(err.line).toBeDefined();
      }
    });

    it('should handle JSON with trailing comma (which is invalid)', () => {
      const json = '{"key": "value",}';

      expect(() => jsonParser.parse(json, 'config.json')).toThrow(ParseError);
    });

    it('should handle JSON with comments (which is invalid)', () => {
      const json = '{"key": "value"} // comment';

      expect(() => jsonParser.parse(json, 'config.json')).toThrow(ParseError);
    });

    it('should parse numbers in scientific notation', () => {
      const json = '{"large": 1e10, "small": 1e-10}';
      const result = jsonParser.parse(json, 'config.json');

      expect(result).toEqual({ large: 1e10, small: 1e-10 });
    });

    it('should parse mixed type arrays', () => {
      const json = '{"mixed": [1, "text", null, true, {"nested": true}]}';
      const result = jsonParser.parse(json, 'config.json');

      expect(result).toEqual({
        mixed: [1, 'text', null, true, { nested: true }],
      });
    });
  });

  describe('stringify', () => {
    it('should stringify simple object', () => {
      const obj = { name: 'test', value: 42 };
      const result = jsonParser.stringify(obj);

      expect(result).toBe('{\n  "name": "test",\n  "value": 42\n}');
    });

    it('should stringify nested objects', () => {
      const obj = { database: { host: 'localhost', port: 5432 } };
      const result = jsonParser.stringify(obj);

      const parsed = JSON.parse(result);
      expect(parsed).toEqual(obj);
    });

    it('should stringify arrays', () => {
      const obj = { items: [1, 2, 3] };
      const result = jsonParser.stringify(obj);

      const parsed = JSON.parse(result);
      expect(parsed).toEqual(obj);
    });

    it('should stringify null values', () => {
      const obj = { value: null };
      const result = jsonParser.stringify(obj);

      expect(result).toBe('{\n  "value": null\n}');
    });

    it('should stringify boolean values', () => {
      const obj = { enabled: true, disabled: false };
      const result = jsonParser.stringify(obj);

      const parsed = JSON.parse(result);
      expect(parsed).toEqual(obj);
    });

    it('should stringify special characters', () => {
      const obj = { text: 'Line 1\nLine 2\tTabbed' };
      const result = jsonParser.stringify(obj);

      const parsed = JSON.parse(result);
      expect(parsed).toEqual(obj);
    });

    it('should stringify unicode characters', () => {
      const obj = { emoji: '🔐', chinese: '世界' };
      const result = jsonParser.stringify(obj);

      const parsed = JSON.parse(result);
      expect(parsed).toEqual(obj);
    });

    it('should stringify empty object', () => {
      const result = jsonParser.stringify({});

      expect(result).toBe('{}');
    });

    it('should stringify arrays at root', () => {
      const arr = [1, 2, 3];
      const result = jsonParser.stringify(arr);

      const parsed = JSON.parse(result);
      expect(parsed).toEqual(arr);
    });

    it('should handle undefined values (property is omitted by JSON.stringify)', () => {
      const obj = { value: undefined };
      const result = jsonParser.stringify(obj);

      // JSON.stringify omits properties with undefined values
      expect(result).toBe('{}');
    });
  });

  describe('round-trip', () => {
    it('should handle parse -> stringify -> parse round-trip', () => {
      const original = {
        string: 'hello',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        nested: {
          key: 'value',
        },
      };

      const parsed = jsonParser.parse(JSON.stringify(original), 'test.json');
      const stringified = jsonParser.stringify(parsed);
      const reparsed = JSON.parse(stringified);

      expect(reparsed).toEqual(original);
    });

    it('should preserve data types through round-trip', () => {
      const original = {
        int: 42,
        float: 3.14,
        bool: true,
        str: 'text',
        arr: [1, 2, 3],
        obj: { nested: true },
        nullVal: null,
      };

      const result = jsonParser.parse(jsonParser.stringify(original), 'test.json');

      expect(result).toEqual(original);
      expect(typeof result.int).toBe('number');
      expect(typeof result.float).toBe('number');
      expect(typeof result.bool).toBe('boolean');
      expect(typeof result.str).toBe('string');
      expect(Array.isArray(result.arr)).toBe(true);
      expect(typeof result.obj).toBe('object');
      expect(result.nullVal).toBeNull();
    });
  });
});
