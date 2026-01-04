/**
 * Custom INI parser implementation.
 * Supports: key-value pairs, sections, nested sections, comments,
 * quoted values, multi-line values.
 */

import type { ConfigParser } from '../types.js';
import { ParseError } from '../errors.js';

//==============================================================================
// Parser
//==============================================================================

class INIParser implements ConfigParser {
  public readonly format = 'ini';
  public readonly extensions = ['.ini'];
  public readonly priority = 60;

  /**
   * Parses INI configuration string into an object.
   *
   * @param content - INI string to parse
   * @param file - File being parsed (for error reporting)
   * @returns Parsed object with nested structure
   *
   * @example
   * ```typescript
   * const parser = new INIParser();
   * const config = parser.parse('[database]\nhost=localhost', 'config.ini');
   * // Returns: { database: { host: 'localhost' } }
   * ```
   */
  parse(content: string, file: string): Record<string, unknown> {
    try {
      const lines = content.split(/\r?\n/);
      const result: Record<string, unknown> = {};
      let currentSection = '';
      let currentKey: string | null = null;
      let currentValue = '';
      let isInValue = false;

      for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        let line = lines[i] || '';

        // Remove leading/trailing whitespace
        const trimmedLine = line.trim();

        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith(';') || trimmedLine.startsWith('#')) {
          continue;
        }

        // Check for section header
        if (trimmedLine.startsWith('[')) {
          // Handle nested sections with dot notation
          const endBracket = trimmedLine.indexOf(']');
          if (endBracket === -1) {
            throw new ParseError(
              'Invalid section header: missing closing bracket',
              file,
              lineNum,
              trimmedLine.length
            );
          }

          const sectionName = trimmedLine.substring(1, endBracket).trim();
          currentSection = sectionName;
          currentKey = null;
          isInValue = false;

          // Ensure section exists in result
          let target = result;
          const parts = sectionName.split('.');
          for (const part of parts) {
            if (!target[part] || typeof target[part] !== 'object') {
              target[part] = {};
            }
            target = target[part] as Record<string, unknown>;
          }

          continue;
        }

        // Check for continuation (multi-line value)
        if (isInValue && (trimmedLine.startsWith(' ') || trimmedLine.startsWith('\t'))) {
          // Continuation line
          currentValue += '\n' + trimmedLine.substring(1);
          continue;
        }

        // Check for key-value pair
        const equalsIndex = line.indexOf('=');
        if (equalsIndex > 0) {
          // We found a complete key-value pair
          if (isInValue && currentKey) {
            // Save previous value
            this.setValue(result, currentSection, currentKey, currentValue);
          }

          const key = line!.substring(0, equalsIndex).trim();
          let value = line!.substring(equalsIndex + 1).trim();

          // Remove inline comment
          const commentIndex = value.indexOf(';');
          if (commentIndex >= 0) {
            value = value.substring(0, commentIndex).trim();
          }

          // Remove # comments (but not if # is in a quoted string)
          const hashIndex = value.indexOf('#');
          if (hashIndex >= 0) {
            value = value.substring(0, hashIndex).trim();
          }

          // Parse quoted values
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.substring(1, value.length - 1);
          }

          currentKey = key;
          currentValue = value;
          isInValue = true;
        } else if (isInValue && currentKey) {
          // We're in the middle of a multi-line value
          currentValue += '\n' + line!;
        } else {
          // Invalid line
          throw new ParseError(
            `Invalid line: expected key=value pair`,
            file,
            lineNum,
            line!.length
          );
        }
      }

      // Save last value
      if (isInValue && currentKey) {
        this.setValue(result, currentSection, currentKey, currentValue);
      }

      return result;
    } catch (error: any) {
      if (error instanceof ParseError) {
        throw error;
      }
      throw new ParseError(`INI parsing error: ${error.message}`, file);
    }
  }

  /**
   * Serializes an object to INI string.
   *
   * @param data - Object to serialize
   * @returns INI string
   *
   * @example
   * ```typescript
   * const parser = new INIParser();
   * const ini = parser.stringify({ database: { host: 'localhost' } });
   * // Returns: '[database]\nhost = localhost\n'
   * ```
   */
  stringify(data: unknown): string {
    return this.objectToINI(data, 0);
  }

  private setValue(
    result: Record<string, unknown>,
    section: string,
    key: string,
    value: string
  ): void {
    // Convert value to appropriate type
    const parsedValue = this.parseValue(value);

    if (!section) {
      // Top-level value
      result[key] = parsedValue;
    } else {
      // Section value
      let target = result;
      const parts = section.split('.');

      for (const part of parts) {
        if (!target[part] || typeof target[part] !== 'object') {
          target[part] = {};
        }
        target = target[part] as Record<string, unknown>;
      }

      target[key] = parsedValue;
    }
  }

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
    if (trimmed.toLowerCase() === 'yes') {
      return true;
    }
    if (trimmed.toLowerCase() === 'no') {
      return false;
    }
    if (trimmed.toLowerCase() === 'on') {
      return true;
    }
    if (trimmed.toLowerCase() === 'off') {
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

  private objectToINI(data: unknown, indent: number, section?: string): string {
    if (data === null || data === undefined) {
      return '';
    }

    const lines: string[] = [];
    const spaces = '  '.repeat(indent);

    if (typeof data === 'object' && !Array.isArray(data)) {
      const entries = Object.entries(data as Record<string, unknown>);

      for (const [key, value] of entries) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Nested object - create a new section
          const newSection = section ? `${section}.${key}` : key;
          lines.push('');
          lines.push(`[${newSection}]`);
          lines.push(this.objectToINI(value, indent, newSection));
        } else {
          // Key-value pair
          const stringValue = this.valueToString(value);
          lines.push(`${spaces}${key} = ${stringValue}`);
        }
      }
    }

    return lines.join('\n');
  }

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
      // Check if string needs quotes
      const str = value as string;
      if (str.includes(' ') || str.includes(';') || str.includes('#') || str.includes('=')) {
        // Escape quotes and wrap in double quotes
        return `"${str.replace(/"/g, '\\"')}"`;
      }
      return str;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.valueToString(item)).join(', ');
    }

    return String(value);
  }
}

export const iniParser = new INIParser();
export default iniParser;
