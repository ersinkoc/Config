/**
 * Tests for INI parser.
 */

import { describe, it, expect } from 'vitest';
import { iniParser } from '../../../src/parsers/ini.js';
import { ParseError } from '../../../src/errors.js';

describe('INIParser', () => {
  describe('properties', () => {
    it('should have correct format', () => {
      expect(iniParser.format).toBe('ini');
    });

    it('should have correct extensions', () => {
      expect(iniParser.extensions).toContain('.ini');
    });

    it('should have priority', () => {
      expect(iniParser.priority).toBe(60);
    });
  });

  describe('parse', () => {
    it('should parse simple key-value pairs', () => {
      const ini = 'name=test\nport=3000';
      const result = iniParser.parse(ini, 'config.ini');
      expect(result.name).toBe('test');
      expect(result.port).toBe(3000);
    });

    it('should parse sections', () => {
      const ini = '[database]\nhost=localhost\nport=5432';
      const result = iniParser.parse(ini, 'config.ini');
      expect(result.database).toEqual({ host: 'localhost', port: 5432 });
    });

    it('should parse nested sections with dots', () => {
      const ini = '[database.connection]\nhost=localhost';
      const result = iniParser.parse(ini, 'config.ini');
      expect((result.database as Record<string, unknown>).connection).toEqual({ host: 'localhost' });
    });

    it('should skip semicolon comments', () => {
      const ini = '; This is a comment\nname=test';
      const result = iniParser.parse(ini, 'config.ini');
      expect(result.name).toBe('test');
    });

    it('should skip hash comments', () => {
      const ini = '# This is a comment\nname=test';
      const result = iniParser.parse(ini, 'config.ini');
      expect(result.name).toBe('test');
    });

    it('should remove inline comments', () => {
      const ini = 'name=test ; this is a comment';
      const result = iniParser.parse(ini, 'config.ini');
      expect(result.name).toBe('test');
    });

    it('should remove hash inline comments', () => {
      const ini = 'name=test # this is a comment';
      const result = iniParser.parse(ini, 'config.ini');
      expect(result.name).toBe('test');
    });

    it('should parse quoted values (double quotes)', () => {
      const ini = 'name="hello world"';
      const result = iniParser.parse(ini, 'config.ini');
      expect(result.name).toBe('hello world');
    });

    it('should parse quoted values (single quotes)', () => {
      const ini = "name='hello world'";
      const result = iniParser.parse(ini, 'config.ini');
      expect(result.name).toBe('hello world');
    });

    it('should parse boolean true', () => {
      const ini = 'enabled=true';
      const result = iniParser.parse(ini, 'config.ini');
      expect(result.enabled).toBe(true);
    });

    it('should parse boolean false', () => {
      const ini = 'disabled=false';
      const result = iniParser.parse(ini, 'config.ini');
      expect(result.disabled).toBe(false);
    });

    it('should parse yes as boolean', () => {
      const ini = 'enabled=yes';
      const result = iniParser.parse(ini, 'config.ini');
      expect(result.enabled).toBe(true);
    });

    it('should parse no as boolean', () => {
      const ini = 'disabled=no';
      const result = iniParser.parse(ini, 'config.ini');
      expect(result.disabled).toBe(false);
    });

    it('should parse on as boolean', () => {
      const ini = 'enabled=on';
      const result = iniParser.parse(ini, 'config.ini');
      expect(result.enabled).toBe(true);
    });

    it('should parse off as boolean', () => {
      const ini = 'disabled=off';
      const result = iniParser.parse(ini, 'config.ini');
      expect(result.disabled).toBe(false);
    });

    it('should parse integers', () => {
      const ini = 'port=3000\nnegative=-10';
      const result = iniParser.parse(ini, 'config.ini');
      expect(result.port).toBe(3000);
      expect(result.negative).toBe(-10);
    });

    it('should parse floats', () => {
      const ini = 'pi=3.14\nnegative=-2.5';
      const result = iniParser.parse(ini, 'config.ini');
      expect(result.pi).toBe(3.14);
      expect(result.negative).toBe(-2.5);
    });

    it('should skip empty lines', () => {
      const ini = 'name=test\n\nport=3000';
      const result = iniParser.parse(ini, 'config.ini');
      expect(result.name).toBe('test');
      expect(result.port).toBe(3000);
    });

    it('should handle Windows line endings', () => {
      const ini = 'name=test\r\nport=3000';
      const result = iniParser.parse(ini, 'config.ini');
      expect(result.name).toBe('test');
      expect(result.port).toBe(3000);
    });

    it('should handle empty values', () => {
      const ini = 'empty=';
      const result = iniParser.parse(ini, 'config.ini');
      expect(result.empty).toBe('');
    });

    it('should throw for missing closing bracket in section', () => {
      const ini = '[invalid\nname=test';
      expect(() => iniParser.parse(ini, 'config.ini')).toThrow(ParseError);
    });

    it('should throw for invalid lines', () => {
      const ini = '[section]\ninvalid line without equals';
      expect(() => iniParser.parse(ini, 'config.ini')).toThrow(ParseError);
    });

    it('should handle multi-line continuation', () => {
      const ini = 'name=start\n value=continuation';
      const result = iniParser.parse(ini, 'config.ini');
      // Multi-line continuation starts with space
      expect(result.name).toBeDefined();
    });

    it('should rethrow ParseError as-is', () => {
      const ini = '[invalid section';
      try {
        iniParser.parse(ini, 'config.ini');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
      }
    });

    it('should handle empty input', () => {
      const result = iniParser.parse('', 'config.ini');
      expect(result).toEqual({});
    });

    it('should handle multiple sections', () => {
      const ini = '[section1]\nkey1=value1\n[section2]\nkey2=value2';
      const result = iniParser.parse(ini, 'config.ini');
      // Parser creates section objects and assigns values to them
      expect(result.section1).toBeDefined();
      expect(result.section2).toBeDefined();
      expect((result.section2 as any).key2).toBe('value2');
    });
  });

  describe('stringify', () => {
    it('should stringify simple objects', () => {
      const result = iniParser.stringify({ name: 'test', port: 3000 });
      expect(result).toContain('name = test');
      expect(result).toContain('port = 3000');
    });

    it('should stringify nested objects as sections', () => {
      const result = iniParser.stringify({ database: { host: 'localhost' } });
      expect(result).toContain('[database]');
      expect(result).toContain('host = localhost');
    });

    it('should stringify booleans', () => {
      const result = iniParser.stringify({ enabled: true, disabled: false });
      expect(result).toContain('enabled = true');
      expect(result).toContain('disabled = false');
    });

    it('should stringify numbers', () => {
      const result = iniParser.stringify({ port: 3000, pi: 3.14 });
      expect(result).toContain('port = 3000');
      expect(result).toContain('pi = 3.14');
    });

    it('should quote values with spaces', () => {
      const result = iniParser.stringify({ name: 'hello world' });
      expect(result).toContain('"hello world"');
    });

    it('should quote values with semicolons', () => {
      const result = iniParser.stringify({ name: 'test;value' });
      expect(result).toContain('"test;value"');
    });

    it('should quote values with hash', () => {
      const result = iniParser.stringify({ name: 'test#value' });
      expect(result).toContain('"test#value"');
    });

    it('should quote values with equals', () => {
      const result = iniParser.stringify({ name: 'a=b' });
      expect(result).toContain('"a=b"');
    });

    it('should stringify arrays as comma-separated', () => {
      const result = iniParser.stringify({ items: [1, 2, 3] });
      expect(result).toContain('1, 2, 3');
    });

    it('should handle null values', () => {
      const result = iniParser.stringify({ value: null });
      expect(result).toContain('value = ');
    });

    it('should handle undefined values', () => {
      const result = iniParser.stringify({ value: undefined });
      expect(result).toContain('value = ');
    });

    it('should handle null input', () => {
      const result = iniParser.stringify(null);
      expect(result).toBe('');
    });

    it('should handle undefined input', () => {
      const result = iniParser.stringify(undefined);
      expect(result).toBe('');
    });

    it('should escape quotes in strings', () => {
      const result = iniParser.stringify({ name: 'hello "world"' });
      expect(result).toContain('\\"');
    });

    it('should stringify deeply nested objects', () => {
      const result = iniParser.stringify({
        section: {
          nested: {
            key: 'value',
          },
        },
      });
      expect(result).toContain('[section.nested]');
    });
  });
});
