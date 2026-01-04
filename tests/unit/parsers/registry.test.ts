/**
 * Tests for ParserRegistry.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ParserRegistry } from '../../../src/parsers/index.js';
import type { ConfigParser } from '../../../src/types.js';

// Create a mock parser
function createMockParser(format: string, extensions: string[]): ConfigParser {
  return {
    format,
    extensions,
    priority: 50,
    parse: (content: string) => JSON.parse(content),
    stringify: (data: unknown) => JSON.stringify(data),
  };
}

describe('ParserRegistry', () => {
  let registry: ParserRegistry;

  beforeEach(() => {
    registry = new ParserRegistry();
  });

  describe('constructor', () => {
    it('should register built-in parsers', () => {
      const extensions = registry.listExtensions();
      expect(extensions).toContain('.json');
      expect(extensions).toContain('.env');
    });
  });

  describe('register', () => {
    it('should register parser for all extensions', () => {
      const parser = createMockParser('custom', ['.custom', '.cust']);
      registry.register(parser);

      expect(registry.get('.custom')).toBe(parser);
      expect(registry.get('.cust')).toBe(parser);
    });

    it('should handle case-insensitive extensions', () => {
      const parser = createMockParser('custom', ['.Custom', '.CUST']);
      registry.register(parser);

      expect(registry.get('.custom')).toBe(parser);
      expect(registry.get('.cust')).toBe(parser);
    });

    it('should overwrite existing parser for extension', () => {
      const parser1 = createMockParser('json1', ['.json']);
      const parser2 = createMockParser('json2', ['.json']);

      registry.register(parser1);
      registry.register(parser2);

      expect(registry.get('.json')).toBe(parser2);
    });
  });

  describe('unregister', () => {
    it('should remove parser by extension', () => {
      const parser = createMockParser('custom', ['.custom']);
      registry.register(parser);
      registry.unregister('.custom');

      expect(registry.get('.custom')).toBeUndefined();
    });

    it('should handle case-insensitive extensions', () => {
      const parser = createMockParser('custom', ['.custom']);
      registry.register(parser);
      registry.unregister('.CUSTOM');

      expect(registry.get('.custom')).toBeUndefined();
    });

    it('should not throw for non-existent extension', () => {
      expect(() => registry.unregister('.nonexistent')).not.toThrow();
    });
  });

  describe('get', () => {
    it('should return parser by extension', () => {
      const parser = createMockParser('custom', ['.custom']);
      registry.register(parser);

      expect(registry.get('.custom')).toBe(parser);
    });

    it('should return undefined for non-existent extension', () => {
      expect(registry.get('.nonexistent')).toBeUndefined();
    });

    it('should handle case-insensitive lookup', () => {
      const parser = createMockParser('custom', ['.custom']);
      registry.register(parser);

      expect(registry.get('.CUSTOM')).toBe(parser);
    });
  });

  describe('detect', () => {
    it('should detect parser from file path', () => {
      const parser = registry.detect('config.json');
      expect(parser).toBeDefined();
      expect(parser?.format).toBe('json');
    });

    it('should detect parser with full path', () => {
      const parser = registry.detect('/path/to/config.json');
      expect(parser).toBeDefined();
      expect(parser?.format).toBe('json');
    });

    it('should handle case-insensitive file extensions', () => {
      const parser = registry.detect('config.JSON');
      expect(parser).toBeDefined();
      expect(parser?.format).toBe('json');
    });

    it('should return undefined for unknown extension', () => {
      const parser = registry.detect('config.unknown');
      expect(parser).toBeUndefined();
    });

    it('should detect env parser', () => {
      const parser = registry.detect('.env');
      expect(parser).toBeDefined();
      expect(parser?.format).toBe('env');
    });
  });

  describe('listExtensions', () => {
    it('should return all registered extensions', () => {
      const extensions = registry.listExtensions();
      expect(Array.isArray(extensions)).toBe(true);
      expect(extensions.length).toBeGreaterThan(0);
    });

    it('should include newly registered extensions', () => {
      const parser = createMockParser('custom', ['.custom']);
      registry.register(parser);

      const extensions = registry.listExtensions();
      expect(extensions).toContain('.custom');
    });
  });

  describe('listParsers', () => {
    it('should return unique parser names', () => {
      const parsers = registry.listParsers();
      expect(Array.isArray(parsers)).toBe(true);
      expect(parsers.length).toBeGreaterThan(0);
    });

    it('should include parser format and extensions', () => {
      const parsers = registry.listParsers();
      const jsonParser = parsers.find((p) => p.includes('json'));
      expect(jsonParser).toBeDefined();
      expect(jsonParser).toContain('.json');
    });

    it('should not duplicate parsers with multiple extensions', () => {
      const parser = createMockParser('multi', ['.ext1', '.ext2']);
      registry.register(parser);

      const parsers = registry.listParsers();
      const multiParsers = parsers.filter((p) => p.includes('multi'));
      expect(multiParsers.length).toBe(1);
    });
  });
});
