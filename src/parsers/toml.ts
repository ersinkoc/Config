/**
 * Custom TOML parser implementation.
 * Supports: key-value pairs, strings, multi-line strings, integers, floats,
 * booleans, dates, arrays, tables, inline tables, array of tables.
 */

import type { ConfigParser } from '../types.js';
import { ParseError } from '../errors.js';

//==============================================================================
// Tokenizer
//==============================================================================

type TokenType =
  | 'EOF'
  | 'KEY'
  | 'EQUALS'
  | 'STRING'
  | 'MULTILINE_STRING'
  | 'LITERAL_STRING'
  | 'MULTILINE_LITERAL_STRING'
  | 'INTEGER'
  | 'FLOAT'
  | 'BOOLEAN'
  | 'DATETIME'
  | 'DATE'
  | 'TIME'
  | 'LBRACK'
  | 'RBRACK'
  | 'DOT'
  | 'COMMA'
  | 'NEWLINE'
  | 'COMMENT'
  | 'LBRACE'
  | 'RBRACE';

interface Token {
  type: TokenType;
  value?: string;
  line: number;
  column: number;
}

class TOMLTokenizer {
  private content: string;
  private position = 0;
  private line = 1;
  private column = 0;

  constructor(content: string) {
    this.content = content;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (!this.isAtEnd()) {
      const char = this.peek();

      // Skip whitespace
      if (char === ' ' || char === '\t') {
        this.consume();
        continue;
      }

      // Handle comments
      if (char === '#') {
        this.consume();
        this.consumeLineComment();
        continue;
      }

      // Handle newlines
      if (char === '\n' || char === '\r') {
        if (char === '\r' && this.peekNext() === '\n') {
          this.consume();
        }
        this.consume();
        tokens.push({
          type: 'NEWLINE',
          line: this.line,
          column: this.column,
        });
        continue;
      }

      // Handle strings
      if (char === '"') {
        const token = this.consumeString();
        tokens.push(token);
        continue;
      }

      // Handle literal strings
      if (char === "'") {
        const token = this.consumeLiteralString();
        tokens.push(token);
        continue;
      }

      // Handle brackets
      if (char === '[') {
        this.consume();
        if (this.peek() === '[') {
          this.consume();
          tokens.push({
            type: 'LBRACK',
            line: this.line,
            column: this.column,
          });
        } else {
          tokens.push({
            type: 'LBRACK',
            line: this.line,
            column: this.column,
          });
        }
        continue;
      }

      if (char === ']') {
        this.consume();
        if (this.peek() === ']') {
          this.consume();
          tokens.push({
            type: 'RBRACK',
            line: this.line,
            column: this.column,
          });
        } else {
          tokens.push({
            type: 'RBRACK',
            line: this.line,
            column: this.column,
          });
        }
        continue;
      }

      // Handle braces
      if (char === '{') {
        this.consume();
        tokens.push({
          type: 'LBRACE',
          line: this.line,
          column: this.column,
        });
        continue;
      }

      if (char === '}') {
        this.consume();
        tokens.push({
          type: 'RBRACE',
          line: this.line,
          column: this.column,
        });
        continue;
      }

      // Handle equals
      if (char === '=') {
        this.consume();
        tokens.push({
          type: 'EQUALS',
          line: this.line,
          column: this.column,
        });
        continue;
      }

      // Handle dots
      if (char === '.') {
        this.consume();
        tokens.push({
          type: 'DOT',
          line: this.line,
          column: this.column,
        });
        continue;
      }

      // Handle commas
      if (char === ',') {
        this.consume();
        tokens.push({
          type: 'COMMA',
          line: this.line,
          column: this.column,
        });
        continue;
      }

      // Handle numbers, booleans, dates
      if (this.isDigit(char) || (char === '-' && this.isDigit(this.peekNext()))) {
        const token = this.consumeNumber();
        tokens.push(token);
        continue;
      }

      // Handle bare keys
      if (this.isBareKeyChar(char)) {
        const token = this.consumeBareKey();
        tokens.push(token);
        continue;
      }

      // Unknown character
      throw new ParseError(
        `Unexpected character: ${char}`,
        '',
        this.line,
        this.column
      );
    }

    tokens.push({
      type: 'EOF',
      line: this.line,
      column: this.column,
    });

    return tokens;
  }

  private isAtEnd(): boolean {
    return this.position >= this.content.length;
  }

  private peek(): string {
    return this.content[this.position] || '\0';
  }

  private peekNext(): string {
    return this.content[this.position + 1] || '\0';
  }

  private consume(): string {
    const char = this.content[this.position++];
    if (char === '\n') {
      this.line++;
      this.column = 0;
    } else {
      this.column++;
    }
    return char;
  }

  private consumeLineComment(): void {
    while (!this.isAtEnd() && this.peek() !== '\n' && this.peek() !== '\r') {
      this.consume();
    }
  }

  private consumeString(): Token {
    this.consume(); // consume opening quote

    let value = '';
    let isMultiline = false;

    // Check for multiline string
    if (this.peek() === '"' && this.peekNext() === '"') {
      this.consume();
      this.consume();
      isMultiline = true;

      // Handle multiline string
      if (this.peek() === '\n') {
        this.consume(); // consume newline after opening quotes
      }

      while (!this.isAtEnd()) {
        if (this.peek() === '"') {
          if (this.peekNext() === '"' && this.peekTwoAhead() === '"') {
            // End of multiline string
            this.consume();
            this.consume();
            this.consume();
            break;
          } else {
            // Escaped quote
            this.consume();
            value += '"';
          }
        } else if (this.peek() === '\\') {
          this.consume();
          const next = this.consume();
          if (next === 'n') {
            value += '\n';
          } else if (next === 't') {
            value += '\t';
          } else if (next === 'r') {
            value += '\r';
          } else if (next === '\\') {
            value += '\\';
          } else if (next === '"') {
            value += '"';
          } else if (next === '/') {
            value += '/';
          } else if (next === 'b') {
            value += '\b';
          } else if (next === 'f') {
            value += '\f';
          } else if (next === 'u') {
            // Unicode escape
            const hex = this.content.substr(this.position, 4);
            this.position += 4;
            value += String.fromCharCode(parseInt(hex, 16));
          } else {
            value += next;
          }
        } else {
          value += this.consume();
        }
      }
    } else {
      // Regular string
      while (!this.isAtEnd()) {
        if (this.peek() === '"') {
          this.consume(); // consume closing quote
          break;
        }

        if (this.peek() === '\\') {
          this.consume();
          const next = this.consume();
          if (next === 'n') {
            value += '\n';
          } else if (next === 't') {
            value += '\t';
          } else if (next === 'r') {
            value += '\r';
          } else if (next === '\\') {
            value += '\\';
          } else if (next === '"') {
            value += '"';
          } else if (next === '/') {
            value += '/';
          } else {
            value += next;
          }
        } else {
          value += this.consume();
        }
      }
    }

    return {
      type: isMultiline ? 'MULTILINE_STRING' : 'STRING',
      value,
      line: this.line,
      column: this.column,
    };
  }

  private consumeLiteralString(): Token {
    this.consume(); // consume opening quote

    let value = '';
    let isMultiline = false;

    // Check for multiline literal string
    if (this.peek() === "'" && this.peekNext() === "'") {
      this.consume();
      this.consume();
      isMultiline = true;

      // Handle multiline literal string
      if (this.peek() === '\n') {
        this.consume(); // consume newline after opening quotes
      }

      while (!this.isAtEnd()) {
        if (this.peek() === "'") {
          if (this.peekNext() === "'" && this.peekTwoAhead() === "'") {
            // End of multiline literal string
            this.consume();
            this.consume();
            this.consume();
            break;
          } else {
            value += this.consume();
          }
        } else {
          value += this.consume();
        }
      }
    } else {
      // Regular literal string
      while (!this.isAtEnd()) {
        if (this.peek() === "'") {
          this.consume(); // consume closing quote
          break;
        }

        value += this.consume();
      }
    }

    return {
      type: isMultiline ? 'MULTILINE_LITERAL_STRING' : 'LITERAL_STRING',
      value,
      line: this.line,
      column: this.column,
    };
  }

  private consumeNumber(): Token {
    let value = '';

    // Handle negative sign
    if (this.peek() === '-') {
      value += this.consume();
    }

    // Integer or float
    while (this.isDigit(this.peek())) {
      value += this.consume();
    }

    // Check for decimal point
    if (this.peek() === '.') {
      value += this.consume();
      while (this.isDigit(this.peek())) {
        value += this.consume();
      }
      return {
        type: 'FLOAT',
        value,
        line: this.line,
        column: this.column,
      };
    }

    return {
      type: 'INTEGER',
      value,
      line: this.line,
      column: this.column,
    };
  }

  private consumeBareKey(): Token {
    let value = '';

    while (!this.isAtEnd() && this.isBareKeyChar(this.peek())) {
      value += this.consume();
    }

    // Check if it's a boolean
    if (value === 'true' || value === 'false') {
      return {
        type: 'BOOLEAN',
        value,
        line: this.line,
        column: this.column,
      };
    }

    return {
      type: 'KEY',
      value,
      line: this.line,
      column: this.column,
    };
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isBareKeyChar(char: string): boolean {
    return /[A-Za-z0-9_-]/.test(char) && char !== '"' && char !== "'" && char !== '.';
  }

  private peekTwoAhead(): string {
    return this.content[this.position + 2] || '\0';
  }
}

//==============================================================================
// Parser
//==============================================================================

interface TOMLTable {
  key: string;
  values: Map<string, unknown>;
  isArrayOfTables: boolean;
}

class TOMLParser {
  private tokens: Token[];
  private position = 0;
  private currentTable = '';
  private tables: Map<string, TOMLTable> = new Map();

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Record<string, unknown> {
    while (!this.isAtEnd()) {
      const token = this.peek();

      if (token.type === 'NEWLINE' || token.type === 'COMMENT') {
        this.consume();
        continue;
      }

      if (token.type === 'LBRACK') {
        this.parseTable();
      } else {
        this.parseKeyValue();
      }
    }

    return this.buildResult();
  }

  private parseTable(): void {
    this.consume(); // consume LBRACK

    const isArrayOfTables = this.peek().type === 'LBRACK';
    if (isArrayOfTables) {
      this.consume(); // consume second LBRACK
    }

    const key = this.parseTableKey();
    const closingType = isArrayOfTables ? 'RBRACK' : 'RBRACK';

    // Find closing bracket
    while (!this.isAtEnd() && this.peek().type !== closingType) {
      this.consume();
    }

    if (this.peek().type === closingType) {
      this.consume();
      if (isArrayOfTables && this.peek().type === 'RBRACK') {
        this.consume();
      }
    }

    this.currentTable = key;

    // Initialize table if it doesn't exist
    if (!this.tables.has(key)) {
      this.tables.set(key, {
        key,
        values: new Map(),
        isArrayOfTables,
      });
    }
  }

  private parseTableKey(): string {
    const parts: string[] = [];

    while (!this.isAtEnd()) {
      const token = this.peek();

      if (token.type === 'RBRACK' || token.type === 'EOF') {
        break;
      }

      if (token.type === 'KEY') {
        parts.push(token.value!);
        this.consume();

        if (this.peek().type === 'DOT') {
          this.consume();
        }
      } else {
        this.consume();
      }
    }

    return parts.join('.');
  }

  private parseKeyValue(): void {
    const keyToken = this.peek();

    if (keyToken.type !== 'KEY') {
      throw new Error('Expected key');
    }

    const key = keyToken.value!;
    this.consume();

    // Expect equals
    const equals = this.peek();
    if (equals.type !== 'EQUALS') {
      throw new Error('Expected equals sign');
    }
    this.consume();

    const value = this.parseValue();

    // Add to current table
    const table = this.tables.get(this.currentTable);
    if (table) {
      table.values.set(key, value);
    }

    // Consume remaining tokens on the line
    while (!this.isAtEnd()) {
      const token = this.peek();
      if (token.type === 'NEWLINE' || token.type === 'COMMENT') {
        break;
      }
      this.consume();
    }
  }

  private parseValue(): unknown {
    const token = this.peek();

    switch (token.type) {
      case 'STRING':
      case 'MULTILINE_STRING':
      case 'LITERAL_STRING':
      case 'MULTILINE_LITERAL_STRING':
        this.consume();
        return token.value;

      case 'INTEGER':
        this.consume();
        return parseInt(token.value!, 10);

      case 'FLOAT':
        this.consume();
        return parseFloat(token.value!);

      case 'BOOLEAN':
        this.consume();
        return token.value === 'true';

      case 'LBRACK':
        return this.parseArray();

      case 'LBRACE':
        return this.parseInlineTable();

      default:
        throw new Error(`Unexpected token: ${token.type}`);
    }
  }

  private parseArray(): unknown[] {
    this.consume(); // consume LBRACK

    const array: unknown[] = [];

    while (!this.isAtEnd()) {
      const token = this.peek();

      if (token.type === 'RBRACK') {
        this.consume();
        break;
      }

      const value = this.parseValue();
      array.push(value);

      const next = this.peek();
      if (next.type === 'COMMA') {
        this.consume();
      }
    }

    return array;
  }

  private parseInlineTable(): Record<string, unknown> {
    this.consume(); // consume LBRACE

    const table: Record<string, unknown> = {};

    while (!this.isAtEnd()) {
      const token = this.peek();

      if (token.type === 'RBRACE') {
        this.consume();
        break;
      }

      if (token.type === 'KEY') {
        const key = token.value!;
        this.consume();

        const equals = this.peek();
        if (equals.type !== 'EQUALS') {
          throw new Error('Expected equals sign');
        }
        this.consume();

        const value = this.parseValue();
        table[key] = value;

        const next = this.peek();
        if (next.type === 'COMMA') {
          this.consume();
        }
      } else {
        this.consume();
      }
    }

    return table;
  }

  private buildResult(): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [tablePath, table] of this.tables.entries()) {
      const keys = tablePath.split('.');
      let current: Record<string, unknown> = result;

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        if (i === keys.length - 1) {
          // Last key, set value
          if (table.isArrayOfTables) {
            if (!current[key]) {
              current[key] = [];
            }
            if (Array.isArray(current[key])) {
              (current[key] as unknown[]).push(Object.fromEntries(table.values));
            }
          } else {
            current[key] = Object.fromEntries(table.values);
          }
        } else {
          // Intermediate key
          if (!current[key]) {
            current[key] = {};
          }
          current = current[key] as Record<string, unknown>;
        }
      }
    }

    return result;
  }

  private isAtEnd(): boolean {
    return this.position >= this.tokens.length || this.peek().type === 'EOF';
  }

  private peek(): Token {
    return this.tokens[this.position];
  }

  private consume(): Token {
    return this.tokens[this.position++];
  }
}

//==============================================================================
// Main Parser Class
//==============================================================================

class TOMLParserImpl implements ConfigParser {
  public readonly format = 'toml';
  public readonly extensions = ['.toml'];
  public readonly priority = 60;

  parse(content: string, file: string): unknown {
    try {
      const tokenizer = new TOMLTokenizer(content);
      const tokens = tokenizer.tokenize();
      const parser = new TOMLParser(tokens);
      return parser.parse();
    } catch (error: any) {
      throw new ParseError(`TOML parsing error: ${error.message}`, file);
    }
  }

  stringify(data: unknown): string {
    return this.objectToTOML(data, 0);
  }

  private objectToTOML(data: unknown, indent: number): string {
    const spaces = '  '.repeat(indent);

    if (data === null || data === undefined) {
      return '';
    }

    if (typeof data === 'string') {
      if (data.includes('"') || data.includes('\n')) {
        return JSON.stringify(data);
      }
      return data;
    }

    if (typeof data === 'number' || typeof data === 'boolean') {
      return String(data);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.objectToTOML(item, indent)).join(', ');
    }

    if (typeof data === 'object') {
      const entries = Object.entries(data as Record<string, unknown>);
      return entries
        .map(([key, value]) => `${spaces}${key} = ${this.objectToTOML(value, indent + 1)}`)
        .join('\n');
    }

    return JSON.stringify(data);
  }
}

export const tomlParser = new TOMLParserImpl();
export default tomlParser;
