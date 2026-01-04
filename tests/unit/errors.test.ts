/**
 * Tests for error classes.
 */

import { describe, it, expect } from 'vitest';
import {
  ConfigError,
  ConfigNotFoundError,
  ParseError,
  ValidationError,
  RequiredFieldError,
  EncryptionError,
  PluginError,
} from '../../src/errors.js';

describe('ConfigError', () => {
  it('should create error with message and code', () => {
    const error = new ConfigError('Test error', 'TEST_CODE');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('ConfigError');
    expect(error.context).toBeUndefined();
  });

  it('should create error with context', () => {
    const context = { key: 'value', num: 42 };
    const error = new ConfigError('Test error', 'TEST_CODE', context);
    expect(error.context).toEqual(context);
  });

  it('should be instanceof Error', () => {
    const error = new ConfigError('Test', 'CODE');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ConfigError);
  });

  it('should have stack trace', () => {
    const error = new ConfigError('Test', 'CODE');
    expect(error.stack).toBeDefined();
  });
});

describe('ConfigNotFoundError', () => {
  it('should create error with path', () => {
    const error = new ConfigNotFoundError('./config.yaml');
    expect(error.message).toBe('Config file not found: ./config.yaml');
    expect(error.code).toBe('CONFIG_NOT_FOUND');
    expect(error.name).toBe('ConfigNotFoundError');
    expect(error.context).toEqual({ path: './config.yaml' });
  });

  it('should be instanceof ConfigError', () => {
    const error = new ConfigNotFoundError('/path/to/file');
    expect(error).toBeInstanceOf(ConfigError);
    expect(error).toBeInstanceOf(ConfigNotFoundError);
  });
});

describe('ParseError', () => {
  it('should create error with message and file', () => {
    const error = new ParseError('Unexpected token', 'config.yaml');
    expect(error.message).toBe('Unexpected token');
    expect(error.code).toBe('PARSE_ERROR');
    expect(error.name).toBe('ParseError');
    expect(error.file).toBe('config.yaml');
    expect(error.line).toBeUndefined();
    expect(error.column).toBeUndefined();
  });

  it('should create error with line and column', () => {
    const error = new ParseError('Syntax error', 'config.json', 10, 5);
    expect(error.file).toBe('config.json');
    expect(error.line).toBe(10);
    expect(error.column).toBe(5);
    expect(error.context).toEqual({ file: 'config.json', line: 10, column: 5 });
  });

  it('should be instanceof ConfigError', () => {
    const error = new ParseError('Error', 'file.yaml');
    expect(error).toBeInstanceOf(ConfigError);
    expect(error).toBeInstanceOf(ParseError);
  });
});

describe('ValidationError', () => {
  it('should create error with message and errors array', () => {
    const errors = [
      { path: 'port', message: 'Must be a number', expected: 'number', actual: 'string' },
      { path: 'host', message: 'Required field' },
    ];
    const error = new ValidationError('Validation failed', errors);
    expect(error.message).toBe('Validation failed');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.name).toBe('ValidationError');
    expect(error.errors).toEqual(errors);
    expect(error.context).toEqual({ errors });
  });

  it('should handle empty errors array', () => {
    const error = new ValidationError('No errors', []);
    expect(error.errors).toEqual([]);
  });

  it('should be instanceof ConfigError', () => {
    const error = new ValidationError('Error', []);
    expect(error).toBeInstanceOf(ConfigError);
    expect(error).toBeInstanceOf(ValidationError);
  });
});

describe('RequiredFieldError', () => {
  it('should create error with field name', () => {
    const error = new RequiredFieldError('database.host');
    expect(error.message).toBe('Required field missing: database.host');
    expect(error.code).toBe('REQUIRED_MISSING');
    expect(error.name).toBe('RequiredFieldError');
    expect(error.context).toEqual({ field: 'database.host' });
  });

  it('should be instanceof ConfigError', () => {
    const error = new RequiredFieldError('field');
    expect(error).toBeInstanceOf(ConfigError);
    expect(error).toBeInstanceOf(RequiredFieldError);
  });
});

describe('EncryptionError', () => {
  it('should create error with message', () => {
    const error = new EncryptionError('Invalid encryption key');
    expect(error.message).toBe('Invalid encryption key');
    expect(error.code).toBe('ENCRYPTION_ERROR');
    expect(error.name).toBe('EncryptionError');
  });

  it('should be instanceof ConfigError', () => {
    const error = new EncryptionError('Error');
    expect(error).toBeInstanceOf(ConfigError);
    expect(error).toBeInstanceOf(EncryptionError);
  });
});

describe('PluginError', () => {
  it('should create error with message and plugin name', () => {
    const error = new PluginError('Failed to initialize', 'yaml-parser');
    expect(error.message).toBe('Failed to initialize');
    expect(error.code).toBe('PLUGIN_ERROR');
    expect(error.name).toBe('PluginError');
    expect(error.pluginName).toBe('yaml-parser');
    expect(error.context).toEqual({ pluginName: 'yaml-parser' });
  });

  it('should be instanceof ConfigError', () => {
    const error = new PluginError('Error', 'plugin');
    expect(error).toBeInstanceOf(ConfigError);
    expect(error).toBeInstanceOf(PluginError);
  });
});
