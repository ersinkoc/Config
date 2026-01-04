/**
 * Tests for ENV parser.
 */

import { describe, it, expect } from 'vitest';
import { envParser } from '../../../src/parsers/env.js';
import { ParseError } from '../../../src/errors.js';

describe('ENVParser', () => {
  describe('properties', () => {
    it('should have correct format', () => {
      expect(envParser.format).toBe('env');
    });

    it('should have correct extensions', () => {
      expect(envParser.extensions).toContain('.env');
    });

    it('should have priority', () => {
      expect(envParser.priority).toBe(70);
    });
  });

  describe('parse', () => {
    it('should parse simple key-value pairs', () => {
      const result = envParser.parse('KEY=value', '.env');
      expect(result).toEqual({ KEY: 'value' });
    });

    it('should parse multiple key-value pairs', () => {
      const content = `
KEY1=value1
KEY2=value2
KEY3=value3
      `;
      const result = envParser.parse(content, '.env');
      expect(result).toEqual({
        KEY1: 'value1',
        KEY2: 'value2',
        KEY3: 'value3',
      });
    });

    it('should skip empty lines', () => {
      const content = `
KEY1=value1

KEY2=value2

      `;
      const result = envParser.parse(content, '.env');
      expect(result).toEqual({ KEY1: 'value1', KEY2: 'value2' });
    });

    it('should skip comments', () => {
      const content = `
# This is a comment
KEY=value
# Another comment
      `;
      const result = envParser.parse(content, '.env');
      expect(result).toEqual({ KEY: 'value' });
    });

    it('should handle export statements', () => {
      const content = `
export KEY1=value1
export KEY2=value2
      `;
      const result = envParser.parse(content, '.env');
      expect(result).toEqual({ KEY1: 'value1', KEY2: 'value2' });
    });

    it('should parse quoted values (double quotes)', () => {
      const result = envParser.parse('KEY="hello world"', '.env');
      expect(result).toEqual({ KEY: 'hello world' });
    });

    it('should parse quoted values (single quotes)', () => {
      const result = envParser.parse("KEY='hello world'", '.env');
      expect(result).toEqual({ KEY: 'hello world' });
    });

    it('should remove inline comments', () => {
      const result = envParser.parse('KEY=value # this is a comment', '.env');
      expect(result).toEqual({ KEY: 'value' });
    });

    it('should not remove comments inside double quotes', () => {
      const result = envParser.parse('KEY="value # not a comment"', '.env');
      expect(result).toEqual({ KEY: 'value # not a comment' });
    });

    it('should not remove comments inside single quotes', () => {
      const result = envParser.parse("KEY='value # not a comment'", '.env');
      expect(result).toEqual({ KEY: 'value # not a comment' });
    });

    it('should parse boolean true (lowercase)', () => {
      const result = envParser.parse('KEY=true', '.env');
      expect(result.KEY).toBe(true);
    });

    it('should parse boolean true (uppercase)', () => {
      const result = envParser.parse('KEY=TRUE', '.env');
      expect(result.KEY).toBe(true);
    });

    it('should parse boolean false (lowercase)', () => {
      const result = envParser.parse('KEY=false', '.env');
      expect(result.KEY).toBe(false);
    });

    it('should parse boolean false (uppercase)', () => {
      const result = envParser.parse('KEY=FALSE', '.env');
      expect(result.KEY).toBe(false);
    });

    it('should parse integers', () => {
      const result = envParser.parse('KEY=42', '.env');
      expect(result.KEY).toBe(42);
    });

    it('should parse negative integers', () => {
      const result = envParser.parse('KEY=-42', '.env');
      expect(result.KEY).toBe(-42);
    });

    it('should parse floats', () => {
      const result = envParser.parse('KEY=3.14', '.env');
      expect(result.KEY).toBe(3.14);
    });

    it('should parse negative floats', () => {
      const result = envParser.parse('KEY=-3.14', '.env');
      expect(result.KEY).toBe(-3.14);
    });

    it('should expand $VAR variables', () => {
      const result = envParser.parse('KEY=$HOME/test', '.env', { HOME: '/home/user' });
      expect(result.KEY).toBe('/home/user/test');
    });

    it('should expand ${VAR} variables', () => {
      const result = envParser.parse('KEY=${HOME}/test', '.env', { HOME: '/home/user' });
      expect(result.KEY).toBe('/home/user/test');
    });

    it('should expand ${VAR:-default} with default when var is empty', () => {
      const result = envParser.parse('KEY=${UNDEFINED:-default}', '.env', {});
      expect(result.KEY).toBe('default');
    });

    it('should expand ${VAR:-default} with existing value', () => {
      const result = envParser.parse('KEY=${HOME:-default}', '.env', { HOME: '/home/user' });
      expect(result.KEY).toBe('/home/user');
    });

    it('should expand ${VAR:-default} when var is empty string', () => {
      const result = envParser.parse('KEY=${EMPTY:-default}', '.env', { EMPTY: '' });
      expect(result.KEY).toBe('default');
    });

    it('should handle empty variable expansion for $VAR', () => {
      const result = envParser.parse('KEY=$UNDEFINED', '.env', {});
      expect(result.KEY).toBe('');
    });

    it('should handle empty variable expansion for ${VAR}', () => {
      const result = envParser.parse('KEY=${UNDEFINED}', '.env', {});
      expect(result.KEY).toBe('');
    });

    it('should throw ParseError for invalid line', () => {
      expect(() => envParser.parse('INVALID_LINE', '.env')).toThrow(ParseError);
    });

    it('should include line number in ParseError', () => {
      try {
        envParser.parse('KEY=value\nINVALID_LINE', '.env');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        const parseError = error as ParseError;
        expect(parseError.line).toBe(2);
      }
    });

    it('should handle Windows line endings', () => {
      const result = envParser.parse('KEY1=value1\r\nKEY2=value2', '.env');
      expect(result).toEqual({ KEY1: 'value1', KEY2: 'value2' });
    });

    it('should handle empty values', () => {
      const result = envParser.parse('KEY=', '.env');
      expect(result.KEY).toBe('');
    });

    it('should handle values with equals sign', () => {
      const result = envParser.parse('KEY=a=b=c', '.env');
      expect(result.KEY).toBe('a=b=c');
    });

    it('should rethrow ParseError as-is', () => {
      const content = 'INVALID';
      try {
        envParser.parse(content, '.env');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
      }
    });
  });

  describe('stringify', () => {
    it('should stringify simple object', () => {
      const result = envParser.stringify({ KEY: 'value' });
      expect(result).toBe('KEY=value\n');
    });

    it('should stringify multiple keys', () => {
      const result = envParser.stringify({ KEY1: 'value1', KEY2: 'value2' });
      expect(result).toContain('KEY1=value1');
      expect(result).toContain('KEY2=value2');
    });

    it('should stringify booleans', () => {
      const result = envParser.stringify({ TRUE_KEY: true, FALSE_KEY: false });
      expect(result).toContain('TRUE_KEY=true');
      expect(result).toContain('FALSE_KEY=false');
    });

    it('should stringify numbers', () => {
      const result = envParser.stringify({ INT: 42, FLOAT: 3.14 });
      expect(result).toContain('INT=42');
      expect(result).toContain('FLOAT=3.14');
    });

    it('should quote values with spaces', () => {
      const result = envParser.stringify({ KEY: 'hello world' });
      expect(result).toContain('KEY="hello world"');
    });

    it('should quote values with hash', () => {
      const result = envParser.stringify({ KEY: 'value#test' });
      expect(result).toContain('KEY="value#test"');
    });

    it('should quote values with equals', () => {
      const result = envParser.stringify({ KEY: 'a=b' });
      expect(result).toContain('KEY="a=b"');
    });

    it('should quote values with dollar sign', () => {
      const result = envParser.stringify({ KEY: '$value' });
      expect(result).toContain('KEY="$value"');
    });

    it('should stringify arrays as comma-separated', () => {
      const result = envParser.stringify({ ARRAY: [1, 2, 3] });
      expect(result).toContain('ARRAY=1,2,3');
    });

    it('should stringify array of strings', () => {
      const result = envParser.stringify({ ARRAY: ['a', 'b', 'c'] });
      expect(result).toContain('ARRAY=a,b,c');
    });

    it('should handle null values', () => {
      const result = envParser.stringify({ KEY: null });
      expect(result).toContain('KEY=');
    });

    it('should handle undefined values', () => {
      const result = envParser.stringify({ KEY: undefined });
      expect(result).toContain('KEY=');
    });

    it('should handle null input', () => {
      const result = envParser.stringify(null);
      expect(result).toBe('');
    });

    it('should handle undefined input', () => {
      const result = envParser.stringify(undefined);
      expect(result).toBe('');
    });

    it('should escape quotes in strings', () => {
      const result = envParser.stringify({ KEY: 'hello "world"' });
      expect(result).toContain('\\"');
    });

    it('should convert objects to string', () => {
      const result = envParser.stringify({ KEY: { nested: 'object' } });
      expect(result).toContain('KEY=');
    });
  });
});
