// @ts-nocheck
/**
 * Tests for parsers/env.ts
 */

import { envParser } from '../parsers/env.js';
import { ParseError } from '../errors.js';

describe('envParser', () => {
  describe('parser interface', () => {
    it('should have correct format', () => {
      expect(envParser.format).toBe('env');
    });

    it('should have correct extensions', () => {
      expect(envParser.extensions).toEqual(['.env']);
    });

    it('should have priority', () => {
      expect(envParser.priority).toBe(70);
    });
  });

  describe('parse', () => {
    it('should parse simple key-value pairs', () => {
      const env = 'DATABASE_HOST=localhost\nDATABASE_PORT=5432';
      const result = envParser.parse(env, '.env');

      expect(result).toEqual({
        DATABASE_HOST: 'localhost',
        DATABASE_PORT: 5432,
      });
    });

    it('should skip empty lines', () => {
      const env = 'KEY1=value1\n\n\nKEY2=value2';
      const result = envParser.parse(env, '.env');

      expect(result).toEqual({
        KEY1: 'value1',
        KEY2: 'value2',
      });
    });

    it('should skip comment lines', () => {
      const env = '# This is a comment\nKEY=value\n# Another comment';
      const result = envParser.parse(env, '.env');

      expect(result).toEqual({ KEY: 'value' });
    });

    it('should handle export statements', () => {
      const env = 'export DATABASE_HOST=localhost\nexport PORT=3000';
      const result = envParser.parse(env, '.env');

      expect(result).toEqual({
        DATABASE_HOST: 'localhost',
        PORT: 3000,
      });
    });

    it('should handle double-quoted values', () => {
      const env = 'MESSAGE="Hello World"\nPATH="some/path"';
      const result = envParser.parse(env, '.env');

      expect(result).toEqual({
        MESSAGE: 'Hello World',
        PATH: 'some/path',
      });
    });

    it('should handle single-quoted values', () => {
      const env = "MESSAGE='Hello World'\nPATH='some/path'";
      const result = envParser.parse(env, '.env');

      expect(result).toEqual({
        MESSAGE: 'Hello World',
        PATH: 'some/path',
      });
    });

    it('should remove inline comments (not in quotes)', () => {
      const env = 'KEY=value # this is a comment';
      const result = envParser.parse(env, '.env');

      expect(result).toEqual({ KEY: 'value' });
    });

    it('should preserve hash in quoted values', () => {
      const env = 'COLOR="#ffffff"';
      const result = envParser.parse(env, '.env');

      expect(result).toEqual({ COLOR: '#ffffff' });
    });

    it('should parse boolean values', () => {
      const env = 'ENABLED=true\nDISABLED=false\nUPPER_TRUE=TRUE\nUPPER_FALSE=FALSE';
      const result = envParser.parse(env, '.env');

      expect(result).toEqual({
        ENABLED: true,
        DISABLED: false,
        UPPER_TRUE: true,
        UPPER_FALSE: false,
      });
    });

    it('should parse integer values', () => {
      const env = 'PORT=3000\nNEGATIVE=-42\nZERO=0';
      const result = envParser.parse(env, '.env');

      expect(result).toEqual({
        PORT: 3000,
        NEGATIVE: -42,
        ZERO: 0,
      });
    });

    it('should parse float values', () => {
      const env = 'PI=3.14\nNEGATIVE=-2.5\nSMALL=.5';
      const result = envParser.parse(env, '.env');

      expect(result).toEqual({
        PI: 3.14,
        NEGATIVE: -2.5,
        SMALL: 0.5,
      });
    });

    it('should expand $VAR variables', () => {
      const env = 'BASE=/home/user\nFULL_PATH=$BASE/config';
      const result = envParser.parse(env, '.env', { BASE: '/home/user' });

      expect(result.FULL_PATH).toBe('/home/user/config');
    });

    it('should expand ${VAR} variables', () => {
      const env = 'HOST=localhost\nURL=http://${HOST}:3000';
      const result = envParser.parse(env, '.env', { HOST: 'localhost' });

      expect(result.URL).toBe('http://localhost:3000');
    });

    it('should expand ${VAR:-default} with default values', () => {
      const env = 'PORT=${PORT:-3000}\nHOST=${HOST:-localhost}';
      const result = envParser.parse(env, '.env', {});

      expect(result.PORT).toBe(3000);
      expect(result.HOST).toBe('localhost');
    });

    it('should use env value over default when available', () => {
      const env = 'PORT=${PORT:-3000}';
      const result = envParser.parse(env, '.env', { PORT: '8080' });

      expect(result.PORT).toBe(8080);
    });

    it('should handle empty variable expansion', () => {
      const env = 'VALUE=$UNDEFINED_VAR';
      const result = envParser.parse(env, '.env', {});

      expect(result.VALUE).toBe('');
    });

    it('should throw ParseError for invalid lines', () => {
      const env = 'INVALID_LINE_WITHOUT_EQUALS';

      expect(() => envParser.parse(env, '.env')).toThrow(ParseError);
    });

    it('should include file info in ParseError', () => {
      const env = 'INVALID';

      try {
        envParser.parse(env, 'test.env');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        expect((error as ParseError).file).toBe('test.env');
      }
    });

    it('should handle Windows line endings', () => {
      const env = 'KEY1=value1\r\nKEY2=value2';
      const result = envParser.parse(env, '.env');

      expect(result).toEqual({
        KEY1: 'value1',
        KEY2: 'value2',
      });
    });

    it('should handle empty content', () => {
      const result = envParser.parse('', '.env');
      expect(result).toEqual({});
    });

    it('should handle only comments and empty lines', () => {
      const env = '# Comment\n\n# Another comment\n';
      const result = envParser.parse(env, '.env');
      expect(result).toEqual({});
    });

    it('should trim keys and values', () => {
      const env = '  KEY  =  value  ';
      const result = envParser.parse(env, '.env');
      expect(result).toEqual({ KEY: 'value' });
    });
  });

  describe('stringify', () => {
    it('should stringify simple object', () => {
      const obj = { KEY: 'value', PORT: 3000 };
      const result = envParser.stringify(obj);

      expect(result).toBe('KEY=value\nPORT=3000\n');
    });

    it('should stringify boolean values', () => {
      const obj = { ENABLED: true, DISABLED: false };
      const result = envParser.stringify(obj);

      expect(result).toBe('ENABLED=true\nDISABLED=false\n');
    });

    it('should stringify number values', () => {
      const obj = { PORT: 3000, PI: 3.14 };
      const result = envParser.stringify(obj);

      expect(result).toBe('PORT=3000\nPI=3.14\n');
    });

    it('should quote strings with spaces', () => {
      const obj = { MESSAGE: 'Hello World' };
      const result = envParser.stringify(obj);

      expect(result).toBe('MESSAGE="Hello World"\n');
    });

    it('should quote strings with special characters', () => {
      const obj = {
        WITH_HASH: 'value#hash',
        WITH_EQUALS: 'key=value',
        WITH_DOLLAR: 'price$100'
      };
      const result = envParser.stringify(obj);

      expect(result).toContain('WITH_HASH="value#hash"');
      expect(result).toContain('WITH_EQUALS="key=value"');
      expect(result).toContain('WITH_DOLLAR="price$100"');
    });

    it('should escape quotes in values', () => {
      const obj = { QUOTE: 'He said "hello"' };
      const result = envParser.stringify(obj);

      expect(result).toBe('QUOTE="He said \\"hello\\""\n');
    });

    it('should handle null and undefined', () => {
      expect(envParser.stringify(null)).toBe('');
      expect(envParser.stringify(undefined)).toBe('');
    });

    it('should handle empty object', () => {
      const result = envParser.stringify({});
      expect(result).toBe('\n');
    });

    it('should stringify arrays as comma-separated values', () => {
      const obj = { ITEMS: [1, 2, 3] };
      const result = envParser.stringify(obj);

      expect(result).toBe('ITEMS=1,2,3\n');
    });

    it('should handle null values in object', () => {
      const obj = { KEY: null };
      const result = envParser.stringify(obj);

      expect(result).toBe('KEY=\n');
    });

    it('should handle undefined values in object', () => {
      const obj = { KEY: undefined };
      const result = envParser.stringify(obj);

      expect(result).toBe('KEY=\n');
    });

    it('should convert objects to string', () => {
      const obj = { NESTED: { key: 'value' } };
      const result = envParser.stringify(obj);

      expect(result).toBe('NESTED=[object Object]\n');
    });
  });

  describe('round-trip', () => {
    it('should handle parse -> stringify -> parse round-trip for simple values', () => {
      const original = 'KEY=value\nPORT=3000\nENABLED=true\n';
      const parsed = envParser.parse(original, '.env');
      const stringified = envParser.stringify(parsed);
      const reparsed = envParser.parse(stringified, '.env');

      expect(reparsed).toEqual(parsed);
    });
  });
});
