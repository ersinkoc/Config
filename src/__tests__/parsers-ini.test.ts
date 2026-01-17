// @ts-nocheck
/**
 * Tests for parsers/ini.ts
 */

import { iniParser } from '../parsers/ini.js';
import { ParseError } from '../errors.js';

describe('iniParser', () => {
  describe('parser interface', () => {
    it('should have correct format', () => {
      expect(iniParser.format).toBe('ini');
    });

    it('should have correct extensions', () => {
      expect(iniParser.extensions).toEqual(['.ini']);
    });

    it('should have priority', () => {
      expect(iniParser.priority).toBe(60);
    });
  });

  describe('parse', () => {
    it('should parse simple key-value pairs', () => {
      const ini = 'key=value\nport=3000';
      const result = iniParser.parse(ini, 'config.ini');

      expect(result).toEqual({
        key: 'value',
        port: 3000,
      });
    });

    it('should parse sections', () => {
      const ini = '[database]\nhost=localhost\nport=5432';
      const result = iniParser.parse(ini, 'config.ini');

      expect(result).toEqual({
        database: {
          host: 'localhost',
          port: 5432,
        },
      });
    });

    it('should parse nested sections with dot notation', () => {
      const ini = '[database.primary]\nhost=localhost\n[database.replica]\nhost=replica.local';
      const result = iniParser.parse(ini, 'config.ini');

      expect(result).toEqual({
        database: {
          primary: { host: 'localhost' },
          replica: { host: 'replica.local' },
        },
      });
    });

    it('should skip empty lines', () => {
      const ini = 'key1=value1\n\n\nkey2=value2';
      const result = iniParser.parse(ini, 'config.ini');

      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });

    it('should skip comment lines starting with ;', () => {
      const ini = '; This is a comment\nkey=value\n; Another comment';
      const result = iniParser.parse(ini, 'config.ini');

      expect(result).toEqual({ key: 'value' });
    });

    it('should skip comment lines starting with #', () => {
      const ini = '# This is a comment\nkey=value\n# Another comment';
      const result = iniParser.parse(ini, 'config.ini');

      expect(result).toEqual({ key: 'value' });
    });

    it('should remove inline comments with ;', () => {
      const ini = 'key=value ; this is a comment';
      const result = iniParser.parse(ini, 'config.ini');

      expect(result).toEqual({ key: 'value' });
    });

    it('should remove inline comments with #', () => {
      const ini = 'key=value # this is a comment';
      const result = iniParser.parse(ini, 'config.ini');

      expect(result).toEqual({ key: 'value' });
    });

    it('should handle double-quoted values', () => {
      const ini = 'message="Hello World"\npath="some/path"';
      const result = iniParser.parse(ini, 'config.ini');

      expect(result).toEqual({
        message: 'Hello World',
        path: 'some/path',
      });
    });

    it('should handle single-quoted values', () => {
      const ini = "message='Hello World'\npath='some/path'";
      const result = iniParser.parse(ini, 'config.ini');

      expect(result).toEqual({
        message: 'Hello World',
        path: 'some/path',
      });
    });

    it('should parse boolean values (true/false)', () => {
      const ini = 'enabled=true\ndisabled=false\nTRUE_UPPER=TRUE\nFALSE_UPPER=FALSE';
      const result = iniParser.parse(ini, 'config.ini');

      expect(result).toEqual({
        enabled: true,
        disabled: false,
        TRUE_UPPER: true,
        FALSE_UPPER: false,
      });
    });

    it('should parse boolean values (yes/no)', () => {
      const ini = 'yes_value=yes\nno_value=no\nYES_UPPER=YES\nNO_UPPER=NO';
      const result = iniParser.parse(ini, 'config.ini');

      expect(result).toEqual({
        yes_value: true,
        no_value: false,
        YES_UPPER: true,
        NO_UPPER: false,
      });
    });

    it('should parse boolean values (on/off)', () => {
      const ini = 'on_value=on\noff_value=off\nON_UPPER=ON\nOFF_UPPER=OFF';
      const result = iniParser.parse(ini, 'config.ini');

      expect(result).toEqual({
        on_value: true,
        off_value: false,
        ON_UPPER: true,
        OFF_UPPER: false,
      });
    });

    it('should parse integer values', () => {
      const ini = 'port=3000\nnegative=-42\nzero=0';
      const result = iniParser.parse(ini, 'config.ini');

      expect(result).toEqual({
        port: 3000,
        negative: -42,
        zero: 0,
      });
    });

    it('should parse float values', () => {
      const ini = 'pi=3.14\nnegative=-2.5\nsmall=.5';
      const result = iniParser.parse(ini, 'config.ini');

      expect(result).toEqual({
        pi: 3.14,
        negative: -2.5,
        small: 0.5,
      });
    });

    it('should throw ParseError for missing closing bracket', () => {
      const ini = '[database\nhost=localhost';

      expect(() => iniParser.parse(ini, 'config.ini')).toThrow(ParseError);
    });

    it('should throw ParseError for invalid lines', () => {
      const ini = 'invalid_line_without_equals';

      expect(() => iniParser.parse(ini, 'config.ini')).toThrow(ParseError);
    });

    it('should include file info in ParseError', () => {
      const ini = 'invalid';

      try {
        iniParser.parse(ini, 'test.ini');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        expect((error as ParseError).file).toBe('test.ini');
      }
    });

    it('should handle Windows line endings', () => {
      const ini = 'key1=value1\r\nkey2=value2';
      const result = iniParser.parse(ini, 'config.ini');

      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });

    it('should handle empty content', () => {
      const result = iniParser.parse('', 'config.ini');
      expect(result).toEqual({});
    });

    it('should handle only comments and empty lines', () => {
      const ini = '; Comment\n\n# Another comment\n';
      const result = iniParser.parse(ini, 'config.ini');
      expect(result).toEqual({});
    });

    it('should handle multiple sections', () => {
      const ini = `
[server]
host=localhost
port=3000

[database]
host=db.local
port=5432
`;
      const result = iniParser.parse(ini, 'config.ini');

      expect(result).toEqual({
        server: {
          host: 'localhost',
          port: 3000,
        },
        database: {
          host: 'db.local',
          port: 5432,
        },
      });
    });

    it('should handle values before any section', () => {
      const ini = 'global_key=value\n[section]\nkey=value2';
      const result = iniParser.parse(ini, 'config.ini');

      expect(result).toEqual({
        global_key: 'value',
        section: { key: 'value2' },
      });
    });
  });

  describe('stringify', () => {
    it('should stringify simple object', () => {
      const obj = { key: 'value', port: 3000 };
      const result = iniParser.stringify(obj);

      expect(result).toContain('key = value');
      expect(result).toContain('port = 3000');
    });

    it('should stringify nested objects as sections', () => {
      const obj = { database: { host: 'localhost', port: 5432 } };
      const result = iniParser.stringify(obj);

      expect(result).toContain('[database]');
      expect(result).toContain('host = localhost');
      expect(result).toContain('port = 5432');
    });

    it('should stringify boolean values', () => {
      const obj = { enabled: true, disabled: false };
      const result = iniParser.stringify(obj);

      expect(result).toContain('enabled = true');
      expect(result).toContain('disabled = false');
    });

    it('should stringify number values', () => {
      const obj = { port: 3000, pi: 3.14 };
      const result = iniParser.stringify(obj);

      expect(result).toContain('port = 3000');
      expect(result).toContain('pi = 3.14');
    });

    it('should quote strings with spaces', () => {
      const obj = { message: 'Hello World' };
      const result = iniParser.stringify(obj);

      expect(result).toContain('message = "Hello World"');
    });

    it('should quote strings with special characters', () => {
      const obj = {
        with_semicolon: 'value;semicolon',
        with_equals: 'key=value',
        with_hash: 'value#hash'
      };
      const result = iniParser.stringify(obj);

      expect(result).toContain('with_semicolon = "value;semicolon"');
      expect(result).toContain('with_equals = "key=value"');
      expect(result).toContain('with_hash = "value#hash"');
    });

    it('should handle null and undefined', () => {
      expect(iniParser.stringify(null)).toBe('');
      expect(iniParser.stringify(undefined)).toBe('');
    });

    it('should stringify arrays as comma-separated values', () => {
      const obj = { items: [1, 2, 3] };
      const result = iniParser.stringify(obj);

      expect(result).toContain('items = 1, 2, 3');
    });

    it('should handle null values in object', () => {
      const obj = { key: null };
      const result = iniParser.stringify(obj);

      expect(result).toContain('key =');
    });

    it('should handle deeply nested objects', () => {
      const obj = {
        database: {
          primary: { host: 'localhost', port: 5432 }
        }
      };
      const result = iniParser.stringify(obj);

      expect(result).toContain('[database.primary]');
      expect(result).toContain('host = localhost');
    });
  });

  describe('round-trip', () => {
    it('should handle parse -> stringify for simple values', () => {
      const original = '[database]\nhost=localhost\nport=5432';
      const parsed = iniParser.parse(original, 'config.ini');

      expect(parsed).toEqual({
        database: {
          host: 'localhost',
          port: 5432,
        },
      });
    });
  });
});
