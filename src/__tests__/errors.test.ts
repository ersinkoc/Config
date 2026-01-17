/**
 * Tests for errors.ts
 */

import {
  ConfigError,
  ConfigNotFoundError,
  ParseError,
  ValidationError,
  RequiredFieldError,
  EncryptionError,
  PluginError,
  type ValidationIssue,
} from '../errors.js';

describe('ConfigError', () => {
  it('should create a ConfigError with message and code', () => {
    const error = new ConfigError('Test error', 'TEST_ERROR');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.name).toBe('ConfigError');
  });

  it('should create a ConfigError with context', () => {
    const context = { key: 'value' };
    const error = new ConfigError('Test error', 'TEST_ERROR', context);
    expect(error.context).toEqual(context);
  });

  it('should have a stack trace', () => {
    const error = new ConfigError('Test error', 'TEST_ERROR');
    expect(error.stack).toBeDefined();
  });
});

describe('ConfigNotFoundError', () => {
  it('should create a ConfigNotFoundError with path', () => {
    const error = new ConfigNotFoundError('./config.yaml');
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.message).toBe('Config file not found: ./config.yaml');
    expect(error.code).toBe('CONFIG_NOT_FOUND');
    expect(error.name).toBe('ConfigNotFoundError');
    expect(error.context?.path).toBe('./config.yaml');
  });

  it('should have correct prototype chain', () => {
    const error = new ConfigNotFoundError('./test.yaml');
    expect(error instanceof ConfigNotFoundError).toBe(true);
    expect(error instanceof ConfigError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });
});

describe('ParseError', () => {
  it('should create a ParseError with message and file', () => {
    const error = new ParseError('Unexpected token', 'config.yaml');
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.message).toBe('Unexpected token');
    expect(error.code).toBe('PARSE_ERROR');
    expect(error.name).toBe('ParseError');
    expect(error.file).toBe('config.yaml');
    expect(error.context?.file).toBe('config.yaml');
  });

  it('should create a ParseError with line and column', () => {
    const error = new ParseError('Unexpected token', 'config.yaml', 10, 5);
    expect(error.line).toBe(10);
    expect(error.column).toBe(5);
    expect(error.context?.line).toBe(10);
    expect(error.context?.column).toBe(5);
  });

  it('should handle undefined line and column', () => {
    const error = new ParseError('Test', 'test.yaml');
    expect(error.line).toBeUndefined();
    expect(error.column).toBeUndefined();
  });
});

describe('ValidationError', () => {
  it('should create a ValidationError with message and errors', () => {
    const issues: ValidationIssue[] = [
      { path: 'port', message: 'Must be a number', expected: 'number', actual: 'string' },
    ];
    const error = new ValidationError('Validation failed', issues);
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.message).toBe('Validation failed');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.name).toBe('ValidationError');
    expect(error.errors).toEqual(issues);
    expect(error.context?.errors).toEqual(issues);
  });

  it('should handle empty errors array', () => {
    const error = new ValidationError('No errors', []);
    expect(error.errors).toEqual([]);
  });

  it('should handle multiple validation issues', () => {
    const issues: ValidationIssue[] = [
      { path: 'port', message: 'Required' },
      { path: 'host', message: 'Invalid format' },
    ];
    const error = new ValidationError('Multiple errors', issues);
    expect(error.errors.length).toBe(2);
  });
});

describe('RequiredFieldError', () => {
  it('should create a RequiredFieldError with field path', () => {
    const error = new RequiredFieldError('database.host');
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.message).toBe('Required field missing: database.host');
    expect(error.code).toBe('REQUIRED_MISSING');
    expect(error.name).toBe('RequiredFieldError');
    expect(error.context?.field).toBe('database.host');
  });

  it('should handle nested field paths', () => {
    const error = new RequiredFieldError('config.database.connection.port');
    expect(error.message).toBe('Required field missing: config.database.connection.port');
  });

  it('should handle simple field names', () => {
    const error = new RequiredFieldError('port');
    expect(error.message).toBe('Required field missing: port');
  });
});

describe('EncryptionError', () => {
  it('should create an EncryptionError with message', () => {
    const error = new EncryptionError('Invalid encryption key');
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.message).toBe('Invalid encryption key');
    expect(error.code).toBe('ENCRYPTION_ERROR');
    expect(error.name).toBe('EncryptionError');
  });

  it('should handle empty message', () => {
    const error = new EncryptionError('');
    expect(error.message).toBe('');
  });

  it('should handle detailed error messages', () => {
    const error = new EncryptionError('Failed to decrypt: Invalid authentication tag');
    expect(error.message).toBe('Failed to decrypt: Invalid authentication tag');
  });
});

describe('PluginError', () => {
  it('should create a PluginError with message and plugin name', () => {
    const error = new PluginError('Failed to initialize plugin', 'yaml-parser');
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.message).toBe('Failed to initialize plugin');
    expect(error.code).toBe('PLUGIN_ERROR');
    expect(error.name).toBe('PluginError');
    expect(error.pluginName).toBe('yaml-parser');
    expect(error.context?.pluginName).toBe('yaml-parser');
  });

  it('should handle plugin names with special characters', () => {
    const error = new PluginError('Test error', '@scope/plugin-name');
    expect(error.pluginName).toBe('@scope/plugin-name');
  });

  it('should handle empty plugin name', () => {
    const error = new PluginError('Test', '');
    expect(error.pluginName).toBe('');
  });
});

describe('Error type guards and behavior', () => {
  it('should allow instanceof checks for all error types', () => {
    const configError = new ConfigError('Test', 'TEST');
    const notFoundError = new ConfigNotFoundError('./test.yaml');
    const parseError = new ParseError('Test', 'test.yaml');
    const validationError = new ValidationError('Test', []);
    const requiredError = new RequiredFieldError('field');
    const encryptionError = new EncryptionError('Test');
    const pluginError = new PluginError('Test', 'plugin');

    expect(configError instanceof ConfigError).toBe(true);
    expect(notFoundError instanceof ConfigNotFoundError).toBe(true);
    expect(notFoundError instanceof ConfigError).toBe(true);
    expect(parseError instanceof ParseError).toBe(true);
    expect(parseError instanceof ConfigError).toBe(true);
    expect(validationError instanceof ValidationError).toBe(true);
    expect(validationError instanceof ConfigError).toBe(true);
    expect(requiredError instanceof RequiredFieldError).toBe(true);
    expect(requiredError instanceof ConfigError).toBe(true);
    expect(encryptionError instanceof EncryptionError).toBe(true);
    expect(encryptionError instanceof ConfigError).toBe(true);
    expect(pluginError instanceof PluginError).toBe(true);
    expect(pluginError instanceof ConfigError).toBe(true);
  });

  it('should have correct error names', () => {
    expect(new ConfigError('Test', 'TEST').name).toBe('ConfigError');
    expect(new ConfigNotFoundError('./test').name).toBe('ConfigNotFoundError');
    expect(new ParseError('Test', 'test.yaml').name).toBe('ParseError');
    expect(new ValidationError('Test', []).name).toBe('ValidationError');
    expect(new RequiredFieldError('field').name).toBe('RequiredFieldError');
    expect(new EncryptionError('Test').name).toBe('EncryptionError');
    expect(new PluginError('Test', 'plugin').name).toBe('PluginError');
  });
});
