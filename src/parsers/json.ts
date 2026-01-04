/**
 * JSON parser - wraps native JSON.parse and JSON.stringify.
 */

import type { ConfigParser } from '../types.js';
import { ParseError } from '../errors.js';

/**
 * JSON parser implementation.
 */
class JSONParser implements ConfigParser {
  public readonly format = 'json';
  public readonly extensions = ['.json'];
  public readonly priority = 50;

  /**
   * Parses JSON configuration string into an object.
   *
   * @param content - JSON string to parse
   * @param file - File being parsed (for error reporting)
   * @returns Parsed object
   *
   * @example
   * ```typescript
   * const parser = new JSONParser();
   * const config = parser.parse('{"name": "test"}', 'config.json');
   * // Returns: { name: "test" }
   * ```
   */
  parse(content: string, file: string): unknown {
    try {
      return JSON.parse(content);
    } catch (error: any) {
      // Try to extract line and column from error
      const message = error.message || 'Invalid JSON';
      const match = message.match(/position (\d+)/i);

      if (match && match[1]) {
        const position = parseInt(match[1], 10);
        const lines = content.substring(0, position).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;

        throw new ParseError(`Invalid JSON: ${message}`, file, line, column);
      }

      throw new ParseError(`Invalid JSON: ${message}`, file);
    }
  }

  /**
   * Serializes an object to JSON string.
   *
   * @param data - Object to serialize
   * @returns JSON string
   *
   * @example
   * ```typescript
   * const parser = new JSONParser();
   * const json = parser.stringify({ name: "test" });
   * // Returns: '{"name":"test"}'
   * ```
   */
  stringify(data: unknown): string {
    return JSON.stringify(data, null, 2);
  }
}

// Export singleton instance
export const jsonParser = new JSONParser();

// Export parser as default
export default jsonParser;
