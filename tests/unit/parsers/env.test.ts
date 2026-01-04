/**
 * Unit tests for ENV parser
 */

import { describe, it, expect } from 'vitest';
import { envParser } from '../../../src/parsers/env.js';

describe('ENV Parser', () => {
  describe('parse', () => {
    it('should parse key-value pairs', () => {
      const content = 'NAME=test\nPORT=3000';
      const result = envParser.parse(content, '.env');
      expect(result).toEqual({ NAME: 'test', PORT: 3000 });
    });

    it('should handle quoted values', () => {
      const content = 'NAME="test value"\nSINGLE=\'test\'';
      const result = envParser.parse(content, '.env');
      expect(result).toEqual({ NAME: 'test value', SINGLE: 'test' });
    });

    it('should parse numbers', () => {
      const content = 'PORT=3000\nTIMEOUT=30.5';
      const result = envParser.parse(content, '.env');
      expect(result).toEqual({ PORT: 3000, TIMEOUT: 30.5 });
    });

    it('should parse booleans', () => {
      const content = 'ENABLED=true\nDISABLED=false';
      const result = envParser.parse(content, '.env');
      expect(result).toEqual({ ENABLED: true, DISABLED: false });
    });

    it('should ignore comments', () => {
      const content = '# This is a comment\nNAME=test\n# Another comment';
      const result = envParser.parse(content, '.env');
      expect(result).toEqual({ NAME: 'test' });
    });

    it('should handle export statements', () => {
      const content = 'export NAME=test\nexport PORT=3000';
      const result = envParser.parse(content, '.env');
      expect(result).toEqual({ NAME: 'test', PORT: 3000 });
    });

    it('should handle empty values', () => {
      const content = 'EMPTY=\nVALUE=test';
      const result = envParser.parse(content, '.env');
      expect(result).toEqual({ EMPTY: '', VALUE: 'test' });
    });
  });

  describe('stringify', () => {
    it('should stringify to ENV format', () => {
      const data = { NAME: 'test', PORT: 3000 };
      const result = envParser.stringify(data);
      expect(result).toContain('NAME=test');
      expect(result).toContain('PORT=3000');
    });

    it('should quote values with spaces', () => {
      const data = { MESSAGE: 'hello world' };
      const result = envParser.stringify(data);
      expect(result).toContain('MESSAGE="hello world"');
    });

    it('should handle booleans and numbers', () => {
      const data = { ENABLED: true, PORT: 3000 };
      const result = envParser.stringify(data);
      expect(result).toContain('ENABLED=true');
      expect(result).toContain('PORT=3000');
    });
  });

  describe('parser metadata', () => {
    it('should have correct format', () => {
      expect(envParser.format).toBe('env');
    });

    it('should have .env extension', () => {
      expect(envParser.extensions).toEqual(['.env']);
    });

    it('should have priority 70', () => {
      expect(envParser.priority).toBe(70);
    });
  });
});
