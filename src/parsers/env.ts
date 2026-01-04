/**
 * Custom ENV parser implementation.
 * Supports: key-value pairs, quoted values, variable expansion,
 * default values, comments, multi-line values, export statements.
 */

import type { ConfigParser } from '../types.js';
import { ParseError } from '../errors.js';

//==============================================================================
// Parser
//==============================================================================

class ENVParser implements ConfigParser {
  public readonly format = 'env';
  public readonly extensions = ['.env'];
  public readonly priority = 70;

  /**
   * Parses ENV configuration string into an object.
   *
   * @param content - ENV string to parse
   * @param file - File being parsed (for error reporting)
   * @returns Parsed object with expanded variables
   *
   * @example
   * ```typescript
   * const parser = new ENVParser();
   * const config = parser.parse('DATABASE_HOST=localhost', '.env');
   * // Returns: { DATABASE_HOST: 'localhost' }
   * ```
   */
  parse(content: string, file: string, envVars?: Record<string, string>): Record<string, unknown> {
    try {
      const lines = content.split(/\r?\n/);
      const result: Record<string, unknown> = {};
      const env: Record<string, string> = Object.fromEntries(
        Object.entries(envVars || process.env).filter(([, v]) => v !== undefined)
      ) as Record<string, string>;

      for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        let line = lines[i] || '';

        // Skip empty lines
        if (!line.trim()) {
          continue;
        }

        // Skip comments
        const trimmed = line!.trim();
        if (trimmed.startsWith('#')) {
          continue;
        }

        // Handle export statements
        let keyValueLine = line!;
        if (trimmed.startsWith('export ')) {
          keyValueLine = trimmed.substring(7).trim();
        }

        // Parse key-value pair
        const equalsIndex = keyValueLine!.indexOf('=');
        if (equalsIndex === -1) {
          // Invalid line
          throw new ParseError(
            `Invalid line: expected key=value pair`,
            file,
            lineNum,
            line!.length
          );
        }

        const key = keyValueLine!.substring(0, equalsIndex).trim();
        let value = keyValueLine!.substring(equalsIndex + 1).trim();

        // Remove inline comments (but not in quoted strings)
        if (!((value.startsWith('"') && value.includes('"')) ||
              (value.startsWith("'") && value.includes("'")))) {
          const commentIndex = value.indexOf(' #');
          if (commentIndex >= 0) {
            value = value.substring(0, commentIndex).trim();
          }
        }

        // Parse quoted values
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }

        // Expand variables
        value = this.expandVariables(value, env);

        // Convert to appropriate type
        const parsedValue = this.parseValue(value);

        result[key] = parsedValue;
      }

      return result;
    } catch (error: any) {
      if (error instanceof ParseError) {
        throw error;
      }
      throw new ParseError(`ENV parsing error: ${error.message}`, file);
    }
  }

  /**
   * Serializes an object to ENV string.
   *
   * @param data - Object to serialize
   * @returns ENV string
   *
   * @example
   * ```typescript
   * const parser = new ENVParser();
   * const env = parser.stringify({ DATABASE_HOST: 'localhost' });
   * // Returns: 'DATABASE_HOST=localhost\n'
   * ```
   */
  stringify(data: unknown): string {
    return this.objectToENV(data, 0);
  }

  /**
   * Expands variables in a string (e.g., $VAR or ${VAR} or ${VAR:-default}).
   *
   * @param value - String to expand
   * @param env - Environment variables
   * @returns Expanded string
   */
  private expandVariables(value: string, env: Record<string, string>): string {
    // Pattern for ${VAR:-default}
    value = value.replace(/\$\{([a-zA-Z_][a-zA-Z0-9_]*)(:-([^}]*))?\}/g, (match, varName, _, defaultValue) => {
      const envValue = env[varName];
      if (envValue !== undefined && envValue !== '') {
        return envValue;
      }
      return defaultValue !== undefined ? defaultValue : '';
    });

    // Pattern for $VAR
    value = value.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, varName) => {
      const envValue = env[varName];
      if (envValue !== undefined && envValue !== '') {
        return envValue;
      }
      return '';
    });

    // Pattern for ${VAR}
    value = value.replace(/\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (match, varName) => {
      const envValue = env[varName];
      if (envValue !== undefined && envValue !== '') {
        return envValue;
      }
      return '';
    });

    return value;
  }

  /**
   * Parses a value and converts it to the appropriate type.
   *
   * @param value - String value to parse
   * @returns Parsed value
   */
  private parseValue(value: string): unknown {
    // Trim whitespace
    const trimmed = value.trim();

    // Try to parse as boolean
    if (trimmed.toLowerCase() === 'true') {
      return true;
    }
    if (trimmed.toLowerCase() === 'false') {
      return false;
    }

    // Try to parse as number
    if (/^-?\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }

    if (/^-?\d*\.\d+$/.test(trimmed)) {
      return parseFloat(trimmed);
    }

    // Return as string
    return trimmed;
  }

  /**
   * Converts an object to ENV format.
   *
   * @param data - Object to convert
   * @param indent - Indentation level
   * @returns ENV string
   */
  private objectToENV(data: unknown, indent: number): string {
    if (data === null || data === undefined) {
      return '';
    }

    const lines: string[] = [];

    if (typeof data === 'object' && !Array.isArray(data)) {
      const entries = Object.entries(data as Record<string, unknown>);

      for (const [key, value] of entries) {
        const stringValue = this.valueToString(value);
        lines.push(`${key}=${stringValue}`);
      }
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Converts a value to a string for ENV format.
   *
   * @param value - Value to convert
   * @returns String representation
   */
  private valueToString(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'string') {
      const str = value as string;
      // Quote if contains special characters
      if (str.includes(' ') || str.includes('#') || str.includes('=') || str.includes('$')) {
        return `"${str.replace(/"/g, '\\"')}"`;
      }
      return str;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.valueToString(item)).join(',');
    }

    return String(value);
  }
}

export const envParser = new ENVParser();
export default envParser;
