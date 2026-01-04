/**
 * Custom YAML parser implementation.
 * Supports: scalars, quoted strings, multi-line strings, arrays, objects,
 * comments, anchors, aliases, document separators.
 */

import type { ConfigParser } from '../types.js';
import { ParseError } from '../errors.js';

//==============================================================================
// Token Types
//==============================================================================

type TokenType =
  | 'EOF'
  | 'KEY'
  | 'VALUE'
  | 'COLON'
  | 'DASH'
  | 'PIPE'
  | 'GT'
  | 'COMMENT'
  | 'INDENT'
  | 'DEDENT'
  | 'NEWLINE'
  | 'LBRACK'
  | 'RBRACK'
  | 'LBRACE'
  | 'RBRACE'
  | 'COMMA'
  | 'ANCHOR'
  | 'ALIAS'
  | 'DOC_START'
  | 'DOC_END';

interface Token {
  type: TokenType;
  value?: string;
  line: number;
  column: number;
}

//==============================================================================
// Tokenizer
//==============================================================================

class YAMLTokenizer {
  private content: string;
  private position = 0;
  private line = 1;
  private column = 0;
  private tokens: Token[] = [];
  private currentIndent = 0;
  private previousToken?: Token;

  constructor(content: string) {
    this.content = content;
  }

  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      const char = this.peek();

      if (char === '\n') {
        this.consume();
        this.tokens.push({
          type: 'NEWLINE',
          line: this.line,
          column: this.column,
        });
      } else if (this.isWhitespace(char)) {
        this.consume();
      } else if (char === '#') {
        this.consume();
        const comment = this.consumeLine();
        this.tokens.push({
          type: 'COMMENT',
          value: comment,
          line: this.line,
          column: this.column,
        });
      } else if (char === '-') {
        this.consume();
        if (this.peek() === ' ') {
          this.tokens.push({
            type: 'DASH',
            line: this.line,
            column: this.column,
          });
          this.consume(); // consume space
        } else {
          this.tokens.push({
            type: 'VALUE',
            value: '-',
            line: this.line,
            column: this.column,
          });
        }
      } else if (char === ':') {
        this.consume();
        this.tokens.push({
          type: 'COLON',
          line: this.line,
          column: this.column,
        });
      } else if (char === '[') {
        this.consume();
        this.tokens.push({
          type: 'LBRACK',
          line: this.line,
          column: this.column,
        });
      } else if (char === ']') {
        this.consume();
        this.tokens.push({
          type: 'RBRACK',
          line: this.line,
          column: this.column,
        });
      } else if (char === '{') {
        this.consume();
        this.tokens.push({
          type: 'LBRACE',
          line: this.line,
          column: this.column,
        });
      } else if (char === '}') {
        this.consume();
        this.tokens.push({
          type: 'RBRACE',
          line: this.line,
          column: this.column,
        });
      } else if (char === ',') {
        this.consume();
        this.tokens.push({
          type: 'COMMA',
          line: this.line,
          column: this.column,
        });
      } else if (char === '|') {
        this.consume();
        this.tokens.push({
          type: 'PIPE',
          line: this.line,
          column: this.column,
        });
      } else if (char === '>') {
        this.consume();
        this.tokens.push({
          type: 'GT',
          line: this.line,
          column: this.column,
        });
      } else if (char === '&') {
        this.consume();
        const name = this.consumeWhile((c) => this.isWordChar(c) || c === '-');
        this.tokens.push({
          type: 'ANCHOR',
          value: name,
          line: this.line,
          column: this.column,
        });
      } else if (char === '*') {
        this.consume();
        const name = this.consumeWhile((c) => this.isWordChar(c) || c === '-');
        this.tokens.push({
          type: 'ALIAS',
          value: name,
          line: this.line,
          column: this.column,
        });
      } else if (char === '.') {
        this.consume();
        this.consume(); // consume second dot
        this.consume(); // consume third dot
        this.tokens.push({
          type: 'DOC_END',
          line: this.line,
          column: this.column,
        });
      } else if (char === '-') {
        // Check for document start
        this.consume();
        if (this.peek() === '-' && this.peekNext() === ' ') {
          this.consume(); // consume second dash
          this.consume(); // consume space
          this.tokens.push({
            type: 'DOC_START',
            line: this.line,
            column: this.column,
          });
        } else {
          this.tokens.push({
            type: 'DASH',
            line: this.line,
            column: this.column,
          });
        }
      } else if (this.isQuote(char)) {
        const value = this.consumeQuotedString(char);
        this.tokens.push({
          type: 'VALUE',
          value,
          line: this.line,
          column: this.column,
        });
      } else if (this.isWordChar(char) || char === '-') {
        // Could be key or value
        const value = this.consumeWhile((c) => this.isWordChar(c) || c === '-' || c === '_');
        this.tokens.push({
          type: 'KEY',
          value,
          line: this.line,
          column: this.column,
        });
      } else {
        // Unknown character, treat as value
        const value = this.consumeWhile((c) => !this.isWhitespace(c) && c !== '\n');
        this.tokens.push({
          type: 'VALUE',
          value,
          line: this.line,
          column: this.column,
        });
      }
    }

    this.tokens.push({
      type: 'EOF',
      line: this.line,
      column: this.column,
    });

    return this.tokens;
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
    const char = this.content[this.position++] || '\0';
    if (char === '\n') {
      this.line++;
      this.column = 0;
    } else {
      this.column++;
    }
    return char;
  }

  private consumeWhile(predicate: (char: string) => boolean): string {
    let result = '';
    while (!this.isAtEnd() && predicate(this.peek())) {
      result += this.consume();
    }
    return result;
  }

  private consumeLine(): string {
    let result = '';
    while (!this.isAtEnd() && this.peek() !== '\n') {
      result += this.consume();
    }
    return result;
  }

  private consumeQuotedString(quote: string): string {
    let result = '';
    this.consume(); // consume opening quote

    while (!this.isAtEnd()) {
      const char = this.peek();

      if (char === '\\') {
        this.consume(); // consume backslash
        const next = this.consume();
        if (next === 'n') {
          result += '\n';
        } else if (next === 't') {
          result += '\t';
        } else if (next === 'r') {
          result += '\r';
        } else if (next === '\\') {
          result += '\\';
        } else if (next === quote) {
          result += quote;
        } else {
          result += next;
        }
      } else if (char === quote) {
        this.consume(); // consume closing quote
        break;
      } else if (char === '\n' && quote === "'") {
        // Single quotes allow newlines
        result += this.consume();
      } else {
        result += this.consume();
      }
    }

    return result;
  }

  private isWhitespace(char: string): boolean {
    return char === ' ' || char === '\t';
  }

  private isWordChar(char: string): boolean {
    return /[a-zA-Z0-9]/.test(char);
  }

  private isQuote(char: string): boolean {
    return char === '"' || char === "'";
  }
}

//==============================================================================
// Parser
//==============================================================================

interface YAMLNode {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  value?: unknown;
  children?: Map<string, YAMLNode>;
  items?: YAMLNode[];
  anchor?: string;
  alias?: string;
}

class YAMLParser {
  private tokens: Token[];
  private position = 0;
  private currentIndent = 0;
  public content = ''; // Store original content for indentation calculations

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): unknown {
    const result: unknown[] = [];

    while (!this.isAtEnd()) {
      const token = this.peek();

      if (token.type === 'DOC_START') {
        this.consume();
        const doc = this.parseDocument();
        if (doc !== null) {
          result.push(doc);
        }
      } else if (token.type === 'NEWLINE' || token.type === 'COMMENT' || token.type === 'EOF') {
        this.consume();
      } else {
        const doc = this.parseDocument();
        if (doc !== null) {
          result.push(doc);
        }
      }
    }

    if (result.length === 1) {
      return result[0];
    }

    return result;
  }

  private parseDocument(): unknown {
    const node = this.parseNode(0);
    return this.nodeToJS(node);
  }

  private parseNode(indent: number): YAMLNode | null {
    let token = this.peek();

    // Skip newlines
    while (token.type === 'NEWLINE') {
      this.consume();
      token = this.peek();
    }

    if (token.type === 'EOF' || token.type === 'DOC_END') {
      return null;
    }

    // Handle anchors
    let anchor: string | undefined;
    if (token.type === 'ANCHOR') {
      anchor = token.value;
      this.consume();
      token = this.peek();
    }

    // Handle aliases
    if (token.type === 'ALIAS') {
      const node: YAMLNode = {
        type: 'string',
        alias: token.value,
      };
      this.consume();
      return node;
    }

    // Handle scalars
    if (token.type === 'VALUE') {
      const value = this.consumeScalar();
      return {
        type: 'string',
        value,
        anchor,
      };
    }

    // Handle arrays
    if (token.type === 'DASH') {
      return this.parseArray(indent);
    }

    // Handle flow-style arrays
    if (token.type === 'LBRACK') {
      this.consume();
      const items: YAMLNode[] = [];

      while (this.peek().type !== 'RBRACK') {
        const node = this.parseNode(indent + 1);
        if (node) {
          items.push(node);
        }

        const next = this.peek();
        if (next.type === 'COMMA') {
          this.consume();
        } else if (next.type !== 'RBRACK' && next.type !== 'NEWLINE') {
          throw new Error('Expected comma or closing bracket');
        }
      }

      this.consume(); // consume RBRACK
      return {
        type: 'array',
        items,
        anchor,
      };
    }

    // Handle flow-style objects
    if (token.type === 'LBRACE') {
      this.consume();
      const children = new Map<string, YAMLNode>();

      while (this.peek().type !== 'RBRACE') {
        const keyToken = this.peek();
        if (keyToken.type !== 'KEY') {
          throw new Error('Expected key');
        }
        const key = keyToken.value!;
        this.consume();

        const colon = this.peek();
        if (colon.type !== 'COLON') {
          throw new Error('Expected colon');
        }
        this.consume();

        const value = this.parseNode(indent + 1);
        children.set(key, value!);

        const next = this.peek();
        if (next.type === 'COMMA') {
          this.consume();
        } else if (next.type !== 'RBRACE') {
          throw new Error('Expected comma or closing brace');
        }
      }

      this.consume(); // consume RBRACE
      return {
        type: 'object',
        children,
        anchor,
      };
    }

    // Handle multi-line strings
    if (token.type === 'PIPE' || token.type === 'GT') {
      const style = token.type;
      this.consume();

      let text = '';
      let currentIndent = indent + 1;

      while (!this.isAtEnd()) {
        const nextToken = this.peek();

        if (nextToken.type === 'NEWLINE') {
          this.consume();
          const line = this.peek();

          if (line.type === 'NEWLINE' || line.type === 'EOF') {
            break;
          }

          // Check indentation
          const lineIndent = this.getCurrentLineIndent();
          if (lineIndent < currentIndent) {
            break;
          }

          text += '\n';
        } else {
          text += nextToken.value || '';
          this.consume();
        }
      }

      return {
        type: 'string',
        value: style === 'PIPE' ? text : text.trim(),
        anchor,
      };
    }

    // Handle objects (block style)
    const children = new Map<string, YAMLNode>();

    // Check if next token is a key
    if (token.type === 'KEY') {
      const key = token.value!;
      this.consume();

      const colon = this.peek();
      if (colon.type === 'COLON') {
        this.consume();
        const value = this.parseNode(indent + 1);
        children.set(key, value!);
      } else {
        // It's just a value
        return {
          type: 'string',
          value: key,
          anchor,
        };
      }
    }

    return {
      type: 'object',
      children,
      anchor,
    };
  }

  private parseArray(indent: number): YAMLNode {
    const items: YAMLNode[] = [];

    while (!this.isAtEnd()) {
      const token = this.peek();

      if (token.type === 'NEWLINE') {
        this.consume();
        continue;
      }

      if (token.type === 'DASH') {
        this.consume(); // consume dash
        const item = this.parseNode(indent + 1);
        if (item) {
          items.push(item);
        }
      } else {
        break;
      }
    }

    return {
      type: 'array',
      items,
    };
  }

  private consumeScalar(): string {
    const token = this.peek();
    this.consume();
    return token.value || '';
  }

  private getCurrentLineIndent(): number {
    let indent = 0;
    let pos = this.position - 1;

    // Go back to start of line
    while (pos >= 0 && this.content[pos] !== '\n') {
      pos--;
    }
    pos++; // move to character after newline

    // Count indentation
    while (pos < this.content.length && this.content[pos] === ' ') {
      indent++;
      pos++;
    }

    return indent;
  }

  private nodeToJS(node: YAMLNode | null): unknown {
    if (!node) {
      return null;
    }

    switch (node.type) {
      case 'string':
        if (node.alias) {
          return `*${node.alias}`;
        }
        return this.parseScalar(node.value as string);

      case 'number':
        return node.value;

      case 'boolean':
        return node.value;

      case 'null':
        return null;

      case 'array':
        return node.items?.map((item) => this.nodeToJS(item)) || [];

      case 'object':
        const obj: Record<string, unknown> = {};

        if (node.children) {
          for (const [key, child] of node.children.entries()) {
            obj[key] = this.nodeToJS(child);
          }
        }

        return obj;

      default:
        return null;
    }
  }

  private parseScalar(value: string): unknown {
    // Try to parse as number
    if (/^-?\d+$/.test(value)) {
      return parseInt(value, 10);
    }

    if (/^-?\d*\.\d+$/.test(value)) {
      return parseFloat(value);
    }

    // Try to parse as boolean
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    if (value === 'null') {
      return null;
    }

    // Try to parse as date
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    return value;
  }

  private isAtEnd(): boolean {
    return this.position >= this.tokens.length || this.peek().type === 'EOF';
  }

  private peek(): Token {
    return this.tokens[this.position]!;
  }

  private consume(): Token {
    return this.tokens[this.position++]!;
  }
}

//==============================================================================
// Main Parser Class
//==============================================================================

class YAMLParserImpl implements ConfigParser {
  public readonly format = 'yaml';
  public readonly extensions = ['.yaml', '.yml'];
  public readonly priority = 60;

  parse(content: string, file: string): unknown {
    try {
      const tokenizer = new YAMLTokenizer(content);
      const tokens = tokenizer.tokenize();
      const parser = new YAMLParser(tokens);
      parser.content = content;
      return parser.parse();
    } catch (error: any) {
      throw new ParseError(`YAML parsing error: ${error.message}`, file);
    }
  }

  stringify(data: unknown): string {
    return this.objectToYAML(data, 0);
  }

  private objectToYAML(data: unknown, indent: number): string {
    const spaces = '  '.repeat(indent);

    if (data === null) {
      return 'null';
    }

    if (typeof data === 'string') {
      if (data.includes('\n')) {
        return `|\n${spaces}${data.split('\n').join(`\n${spaces}`)}`;
      }
      if (data.includes(':') || data.includes('#')) {
        return JSON.stringify(data);
      }
      return data;
    }

    if (typeof data === 'number' || typeof data === 'boolean') {
      return String(data);
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return '[]';
      }

      return data
        .map((item) => `${spaces}- ${this.objectToYAML(item, indent + 1)}`)
        .join('\n');
    }

    if (typeof data === 'object') {
      const entries = Object.entries(data as Record<string, unknown>);

      if (entries.length === 0) {
        return '{}';
      }

      return entries
        .map(([key, value]) => {
          const yamlValue = this.objectToYAML(value, indent + 1);
          if (yamlValue.includes('\n')) {
            return `${spaces}${key}:\n${yamlValue}`;
          }
          return `${spaces}${key}: ${yamlValue}`;
        })
        .join('\n');
    }

    return JSON.stringify(data);
  }
}

export const yamlParser = new YAMLParserImpl();
export default yamlParser;
