/**
 * Parser registry for managing configuration format parsers.
 */

import type { ConfigParser, ParserRegistration } from '../types.js';

// Import all parsers
import { jsonParser } from './json.js';
import { yamlParser } from './yaml.js';
import { tomlParser } from './toml.js';
import { iniParser } from './ini.js';
import { envParser } from './env.js';

/**
 * Parser registry for managing and accessing configuration parsers.
 */
export class ParserRegistry {
  private parsers = new Map<string, ParserRegistration>();

  constructor() {
    // Register built-in parsers
    this.register(jsonParser);
    this.register(envParser);
  }

  /**
   * Registers a parser.
   *
   * @param parser - Parser to register
   *
   * @example
   * ```typescript
   * registry.register(myCustomParser);
   * ```
   */
  register(parser: ConfigParser): void {
    for (const ext of parser.extensions) {
      this.parsers.set(ext.toLowerCase(), {
        parser,
        registeredAt: Date.now(),
      });
    }
  }

  /**
   * Unregisters a parser by extension.
   *
   * @param extension - File extension (e.g., '.json', '.yaml')
   *
   * @example
   * ```typescript
   * registry.unregister('.json');
   * ```
   */
  unregister(extension: string): void {
    this.parsers.delete(extension.toLowerCase());
  }

  /**
   * Gets a parser by file extension.
   *
   * @param extension - File extension
   * @returns Parser or undefined if not found
   *
   * @example
   * ```typescript
   * const parser = registry.get('.json');
   * ```
   */
  get(extension: string): ConfigParser | undefined {
    const registration = this.parsers.get(extension.toLowerCase());
    return registration?.parser;
  }

  /**
   * Detects parser from file path.
   *
   * @param filePath - Path to file
   * @returns Detected parser
   *
   * @example
   * ```typescript
   * const parser = registry.detect('./config.yaml');
   * ```
   */
  detect(filePath: string): ConfigParser | undefined {
    // Remove query string if present
    const pathWithoutQuery = filePath.split('?')[0];

    // Try to match the longest known extension first (for cases like .tar.gz)
    const knownExtensions = Array.from(this.parsers.keys()).sort(
      (a, b) => b.length - a.length
    );

    for (const ext of knownExtensions) {
      if (pathWithoutQuery.toLowerCase().endsWith(ext)) {
        return this.get(ext);
      }
    }

    // Fallback to getting extension after last dot
    const lastDotIndex = pathWithoutQuery.lastIndexOf('.');
    if (lastDotIndex > 0) {
      const extension = pathWithoutQuery.slice(lastDotIndex);
      return this.get(extension.toLowerCase());
    }

    return undefined;
  }

  /**
   * Lists all registered extensions.
   *
   * @returns Array of extensions
   *
   * @example
   * ```typescript
   * const extensions = registry.listExtensions();
   * // ['.json', '.yaml', '.yml', '.toml', '.ini', '.env']
   * ```
   */
  listExtensions(): string[] {
    return Array.from(this.parsers.keys());
  }

  /**
   * Lists all registered parsers.
   *
   * @returns Array of parser names
   *
   * @example
   * ```typescript
   * const parsers = registry.listParsers();
   * ```
   */
  listParsers(): string[] {
    const seen = new Set<string>();
    const parsers: string[] = [];

    for (const registration of this.parsers.values()) {
      const name = `${registration.parser.format} (${registration.parser.extensions.join(', ')})`;
      if (!seen.has(name)) {
        seen.add(name);
        parsers.push(name);
      }
    }

    return parsers;
  }
}

// Export singleton instance
export const parserRegistry = new ParserRegistry();

// Register all parsers
parserRegistry.register(jsonParser);
parserRegistry.register(yamlParser);
parserRegistry.register(tomlParser);
parserRegistry.register(iniParser);
parserRegistry.register(envParser);

// Export all parsers
export { jsonParser } from './json.js';
export { yamlParser } from './yaml.js';
export { tomlParser } from './toml.js';
export { iniParser } from './ini.js';
export { envParser } from './env.js';
