/**
 * Unit tests for JSON parser
 */

import { describe, it, expect } from 'vitest';
import { jsonParser } from '../../../src/parsers/json.js';

describe('JSON Parser', () => {
  describe('parse', () => {
    it('should parse valid JSON', () => {
      const content = '{"name": "test", "port": 3000}';
      const result = jsonParser.parse(content, 'test.json');
      expect(result).toEqual({ name: 'test', port: 3000 });
    });

    it('should parse nested objects', () => {
      const content = '{"database": {"host": "localhost", "port": 5432}}';
      const result = jsonParser.parse(content, 'test.json');
      expect(result).toEqual({
        database: { host: 'localhost', port: 5432 },
      });
    });

    it('should parse arrays', () => {
      const content = '{"items": [1, 2, 3]}';
      const result = jsonParser.parse(content, 'test.json');
      expect(result).toEqual({ items: [1, 2, 3] });
    });

    it('should throw ParseError for invalid JSON', () => {
      const content = '{"invalid": json}';
      expect(() => jsonParser.parse(content, 'test.json')).toThrow();
    });

    it('should include file in error', () => {
      const content = '{invalid}';
      try {
        jsonParser.parse(content, 'test.json');
      } catch (error: any) {
        expect(error.file).toBe('test.json');
      }
    });
  });

  describe('stringify', () => {
    it('should stringify objects', () => {
      const obj = { name: 'test', port: 3000 };
      const result = jsonParser.stringify(obj);
      expect(JSON.parse(result)).toEqual(obj);
    });

    it('should format with 2-space indentation', () => {
      const obj = { a: { b: 1 } };
      const result = jsonParser.stringify(obj);
      expect(result).toContain('  ');
    });

    it('should handle primitives', () => {
      expect(jsonParser.stringify(42)).toBe('42');
      expect(jsonParser.stringify('string')).toBe('"string"');
      expect(jsonParser.stringify(true)).toBe('true');
      expect(jsonParser.stringify(null)).toBe('null');
    });
  });

  describe('parser metadata', () => {
    it('should have correct format', () => {
      expect(jsonParser.format).toBe('json');
    });

    it('should have .json extension', () => {
      expect(jsonParser.extensions).toEqual(['.json']);
    });

    it('should have priority 50', () => {
      expect(jsonParser.priority).toBe(50);
    });
  });
});
