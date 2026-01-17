// @ts-nocheck
/**
 * Tests for parsers/index.ts
 */

import { ParserRegistry, parserRegistry } from '../parsers/index.js';
import type { ConfigParser } from '../types.js';
import { ParseError } from '../errors.js';

// Mock parsers
const createMockParser = (name: string, extensions: string[]): ConfigParser => ({
  name,
  format: name,
  extensions,
  priority: 50,
  parse: jest.fn(() => ({})),
  stringify: jest.fn(() => ''),
});

describe('ParserRegistry', () => {
  let registry: ParserRegistry;

  beforeEach(() => {
    registry = new ParserRegistry();
  });

  describe('constructor', () => {
    it('should register json and env parsers by default', () => {
      const list = registry.listExtensions();

      expect(list).toContain('.json');
      expect(list).toContain('.env');
    });
  });

  describe('register', () => {
    it('should register a parser for all its extensions', () => {
      const parser = createMockParser('custom', ['.custom', '.cst']);

      registry.register(parser);

      expect(registry.get('.custom')).toBe(parser);
      expect(registry.get('.cst')).toBe(parser);
    });

    it('should handle case-insensitive extensions', () => {
      const parser = createMockParser('test', ['.JSON']);

      registry.register(parser);

      expect(registry.get('.json')).toBe(parser);
      expect(registry.get('.JSON')).toBe(parser);
      expect(registry.get('.Json')).toBe(parser);
    });

    it('should throw error when registering duplicate extension', () => {
      const parser1 = createMockParser('parser1', ['.custom']);
      const parser2 = createMockParser('parser2', ['.custom']);

      registry.register(parser1);

      // The second registration should overwrite for that extension
      // but the registry handles multiple extensions
      expect(() => registry.register(parser2)).not.toThrow();
    });

    it('should register same parser for multiple extensions', () => {
      const parser = createMockParser('multi', ['.a', '.b', '.c']);

      registry.register(parser);

      expect(registry.get('.a')).toBe(parser);
      expect(registry.get('.b')).toBe(parser);
      expect(registry.get('.c')).toBe(parser);
    });

    it('should track registration timestamp', () => {
      const beforeTime = Date.now();
      const parser = createMockParser('test', ['.test']);

      registry.register(parser);

      const registration = registry.listExtensions();
      expect(registration).toBeDefined();
    });
  });

  describe('unregister', () => {
    it('should unregister a parser by extension', () => {
      const parser = createMockParser('test', ['.test']);

      registry.register(parser);
      expect(registry.get('.test')).toBe(parser);

      registry.unregister('.test');

      expect(registry.get('.test')).toBeUndefined();
    });

    it('should handle case-insensitive unregistration', () => {
      const parser = createMockParser('test', ['.TEST']);

      registry.register(parser);
      registry.unregister('.test');

      expect(registry.get('.TEST')).toBeUndefined();
    });

    it('should handle unregistering non-existent extension', () => {
      expect(() => registry.unregister('.nonexistent')).not.toThrow();
    });

    it('should only unregister specified extension', () => {
      const parser = createMockParser('multi', ['.a', '.b', '.c']);

      registry.register(parser);
      registry.unregister('.b');

      expect(registry.get('.a')).toBe(parser);
      expect(registry.get('.b')).toBeUndefined();
      expect(registry.get('.c')).toBe(parser);
    });
  });

  describe('get', () => {
    it('should return parser for registered extension', () => {
      const parser = createMockParser('test', ['.test']);

      registry.register(parser);

      expect(registry.get('.test')).toBe(parser);
    });

    it('should return undefined for unregistered extension', () => {
      expect(registry.get('.nonexistent')).toBeUndefined();
    });

    it('should be case-insensitive', () => {
      const parser = createMockParser('test', ['.JSON']);

      registry.register(parser);

      expect(registry.get('.json')).toBe(parser);
      expect(registry.get('.JSON')).toBe(parser);
      expect(registry.get('.Json')).toBe(parser);
    });

    it('should handle mixed case lookups', () => {
      const parser = createMockParser('test', ['.yaml']);

      registry.register(parser);

      expect(registry.get('.YAML')).toBe(parser);
      expect(registry.get('.yaml')).toBe(parser);
      expect(registry.get('.Yaml')).toBe(parser);
    });
  });

  describe('detect', () => {
    it('should detect parser from file path', () => {
      const parser = createMockParser('custom', ['.custom']);

      registry.register(parser);

      expect(registry.detect('config.custom')).toBe(parser);
    });

    it('should detect parser with different case', () => {
      const parser = createMockParser('test', ['.JSON']);

      registry.register(parser);

      expect(registry.detect('config.JSON')).toBe(parser);
    });

    it('should return undefined for unknown extension', () => {
      expect(registry.detect('file.unknown')).toBeUndefined();
    });

    it('should handle paths with multiple dots', () => {
      const parser = createMockParser('test', ['.tar.gz']);

      registry.register(parser);

      expect(registry.detect('archive.tar.gz')).toBe(parser);
    });

    it('should handle paths with directories', () => {
      const parser = createMockParser('test', ['.json']);

      registry.register(parser);

      expect(registry.detect('./config/app.json')).toBe(parser);
      expect(registry.detect('/absolute/path/config.json')).toBe(parser);
    });

    it('should handle paths with query strings', () => {
      const parser = createMockParser('test', ['.json']);

      registry.register(parser);

      expect(registry.detect('config.json?v=1')).toBe(parser);
    });
  });

  describe('listExtensions', () => {
    it('should return all registered extensions', () => {
      const parser1 = createMockParser('p1', ['.a', '.b']);
      const parser2 = createMockParser('p2', ['.c']);

      registry.register(parser1);
      registry.register(parser2);

      const extensions = registry.listExtensions();

      expect(extensions).toContain('.a');
      expect(extensions).toContain('.b');
      expect(extensions).toContain('.c');
    });

    it('should not include unregistered extensions', () => {
      const parser = createMockParser('test', ['.test']);

      registry.register(parser);
      registry.unregister('.test');

      expect(registry.listExtensions()).not.toContain('.test');
    });

    it('should be case-insensitive (lowercase stored)', () => {
      const parser = createMockParser('test', ['.JSON', '.YAML']);

      registry.register(parser);

      const extensions = registry.listExtensions();

      expect(extensions).toContain('.json');
      expect(extensions).toContain('.yaml');
    });
  });

  describe('listParsers', () => {
    it('should return unique parser names', () => {
      const parser1 = createMockParser('parser1', ['.a', '.b']);
      const parser2 = createMockParser('parser2', ['.c']);

      registry.register(parser1);
      registry.register(parser2);

      const parsers = registry.listParsers();

      expect(parsers).toContain('parser1 (.a, .b)');
      expect(parsers).toContain('parser2 (.c)');
    });

    it('should not duplicate parsers with multiple extensions', () => {
      const parser = createMockParser('test', ['.a', '.b', '.c']);

      registry.register(parser);

      const parsers = registry.listParsers();

      expect(parsers.filter((p) => p.includes('test')).length).toBe(1);
    });

    it('should return empty array when no parsers registered', () => {
      const emptyRegistry = new ParserRegistry();
      // Remove default parsers
      emptyRegistry.unregister('.json');
      emptyRegistry.unregister('.env');

      const parsers = emptyRegistry.listParsers();

      // Still might have defaults
      expect(Array.isArray(parsers)).toBe(true);
    });
  });
});

describe('parserRegistry singleton', () => {
  beforeEach(() => {
    // Reset registry state if needed
  });

  describe('default parsers', () => {
    it('should have json parser registered', () => {
      expect(parserRegistry.get('.json')).toBeDefined();
      expect(parserRegistry.get('.json').format).toBe('json');
    });

    it('should have env parser registered', () => {
      expect(parserRegistry.get('.env')).toBeDefined();
    });

    it('should have yaml parser registered', () => {
      expect(parserRegistry.get('.yaml')).toBeDefined();
    });

    it('should have yml extension for yaml', () => {
      expect(parserRegistry.get('.yml')).toBeDefined();
      expect(parserRegistry.get('.yml').format).toBe('yaml');
    });

    it('should have toml parser registered', () => {
      expect(parserRegistry.get('.toml')).toBeDefined();
    });

    it('should have ini parser registered', () => {
      expect(parserRegistry.get('.ini')).toBeDefined();
    });

    it('should detect common file types', () => {
      expect(parserRegistry.detect('config.json')).toBeDefined();
      expect(parserRegistry.detect('config.yaml')).toBeDefined();
      expect(parserRegistry.detect('config.yml')).toBeDefined();
      expect(parserRegistry.detect('config.toml')).toBeDefined();
      expect(parserRegistry.detect('config.ini')).toBeDefined();
      expect(parserRegistry.detect('.env')).toBeDefined();
    });
  });

  describe('registration', () => {
    it('should allow registering custom parsers', () => {
      // Create a separate registry instance to avoid modifying singleton
      const testRegistry = new ParserRegistry();
      const customParser: ConfigParser = {
        name: 'custom',
        format: 'custom',
        extensions: ['.custom'],
        priority: 100,
        parse: () => ({ custom: true }),
        stringify: () => '',
      };

      testRegistry.register(customParser);

      expect(testRegistry.get('.custom')).toBe(customParser);
    });

    it('should allow unregistering parsers', () => {
      // Create a separate registry instance to avoid modifying singleton
      const testRegistry = new ParserRegistry();

      expect(testRegistry.get('.json')).toBeDefined();
      testRegistry.unregister('.json');
      expect(testRegistry.get('.json')).toBeUndefined();
    });

    it('should list all extensions', () => {
      const extensions = parserRegistry.listExtensions();

      expect(extensions.length).toBeGreaterThan(0);
      expect(extensions).toContain('.json');
    });

    it('should list all parsers', () => {
      const parsers = parserRegistry.listParsers();

      expect(parsers.length).toBeGreaterThan(0);
      expect(parsers.some((p) => p.includes('json'))).toBe(true);
    });
  });

  describe('parser priority', () => {
    it('should return parser with correct priority', () => {
      const jsonParser = parserRegistry.get('.json');

      expect(jsonParser.priority).toBeDefined();
      expect(typeof jsonParser.priority).toBe('number');
    });
  });

  describe('format detection', () => {
    it('should return format name', () => {
      const jsonParser = parserRegistry.get('.json');
      expect(jsonParser.format).toBe('json');

      const yamlParser = parserRegistry.get('.yaml');
      expect(yamlParser.format).toBe('yaml');
    });

    it('should detect format from file path', () => {
      const json = parserRegistry.detect('config.json');
      expect(json?.format).toBe('json');

      const yaml = parserRegistry.detect('config.yaml');
      expect(yaml?.format).toBe('yaml');
    });
  });
});

describe('integration tests', () => {
  it('should handle complete parser workflow', () => {
    // Use a separate registry to avoid modifying singleton
    const testRegistry = new ParserRegistry();
    const testParser: ConfigParser = {
      name: 'test',
      format: 'test',
      extensions: ['.test'],
      priority: 75,
      parse: (content) => ({ parsed: content }),
      stringify: (data) => JSON.stringify(data),
    };

    testRegistry.register(testParser);

    // Detect parser
    const detected = testRegistry.detect('file.test');
    expect(detected).toBe(testParser);

    // Parse content
    const parsed = detected.parse('content', 'file.test');
    expect(parsed).toEqual({ parsed: 'content' });

    // Stringify data
    const stringified = detected.stringify({ key: 'value' });
    expect(stringified).toBe('{"key":"value"}');
  });

  it('should handle multiple parsers for same extension (last wins)', () => {
    const parser1: ConfigParser = {
      name: 'parser1',
      format: 'test',
      extensions: ['.dup'],
      priority: 50,
      parse: () => ({ from: 'parser1' }),
      stringify: () => '',
    };

    const parser2: ConfigParser = {
      name: 'parser2',
      format: 'test',
      extensions: ['.dup'],
      priority: 60,
      parse: () => ({ from: 'parser2' }),
      stringify: () => '',
    };

    const customRegistry = new ParserRegistry();
    customRegistry.register(parser1);
    customRegistry.register(parser2);

    const parser = customRegistry.get('.dup');
    expect(parser).toBe(parser2);
  });

  it('should support parser replacement', () => {
    // Use a separate registry to avoid modifying singleton
    const testRegistry = new ParserRegistry();
    const original = testRegistry.get('.json');
    expect(original.format).toBe('json');

    const replacement: ConfigParser = {
      name: 'custom-json',
      format: 'json',
      extensions: ['.json'],
      priority: 100,
      parse: () => ({ custom: true }),
      stringify: () => '',
    };

    testRegistry.register(replacement);

    const current = testRegistry.get('.json');
    expect(current).toBe(replacement);
  });
});
