/**
 * Base error class for all config-related errors.
 *
 * @example
 * ```typescript
 * throw new ConfigError('Invalid configuration', 'INVALID_CONFIG');
 * ```
 */
export class ConfigError extends Error {
  /**
   * Creates a new ConfigError instance.
   *
   * @param message - Error message
   * @param code - Error code for programmatic handling
   * @param context - Additional context information
   */
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ConfigError';
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Thrown when a configuration file cannot be found.
 *
 * @example
 * ```typescript
 * throw new ConfigNotFoundError('./config.yaml');
 * ```
 */
export class ConfigNotFoundError extends ConfigError {
  /**
   * Creates a new ConfigNotFoundError instance.
   *
   * @param path - Path to the missing config file
   */
  constructor(path: string) {
    super(`Config file not found: ${path}`, 'CONFIG_NOT_FOUND', { path });
    this.name = 'ConfigNotFoundError';
  }
}

/**
 * Thrown when parsing a configuration file fails.
 *
 * @example
 * ```typescript
 * throw new ParseError('Unexpected token', 'config.yaml', 10, 5);
 * ```
 */
export class ParseError extends ConfigError {
  /**
   * Creates a new ParseError instance.
   *
   * @param message - Error message
   * @param file - File being parsed
   * @param line - Line number where error occurred (1-based)
   * @param column - Column number where error occurred (1-based)
   */
  constructor(
    message: string,
    public readonly file: string,
    public readonly line?: number,
    public readonly column?: number
  ) {
    super(message, 'PARSE_ERROR', { file, line, column });
    this.name = 'ParseError';
  }
}

/**
 * Represents a single validation issue.
 */
export interface ValidationIssue {
  /** Path to the invalid property */
  path: string;

  /** Error message */
  message: string;

  /** Expected value or type */
  expected?: string;

  /** Actual value */
  actual?: unknown;
}

/**
 * Thrown when configuration validation fails.
 *
 * @example
 * ```typescript
 * throw new ValidationError('Validation failed', [
 *   { path: 'port', message: 'Must be a number', expected: 'number', actual: 'string' }
 * ]);
 * ```
 */
export class ValidationError extends ConfigError {
  /**
   * Creates a new ValidationError instance.
   *
   * @param message - Error message
   * @param errors - Array of validation issues
   */
  constructor(
    message: string,
    public readonly errors: ValidationIssue[]
  ) {
    super(message, 'VALIDATION_ERROR', { errors });
    this.name = 'ValidationError';
  }
}

/**
 * Thrown when a required configuration field is missing.
 *
 * @example
 * ```typescript
 * throw new RequiredFieldError('database.host');
 * ```
 */
export class RequiredFieldError extends ConfigError {
  /**
   * Creates a new RequiredFieldError instance.
   *
   * @param field - Path to the missing required field
   */
  constructor(field: string) {
    super(`Required field missing: ${field}`, 'REQUIRED_MISSING', { field });
    this.name = 'RequiredFieldError';
  }
}

/**
 * Thrown when encryption or decryption operations fail.
 *
 * @example
 * ```typescript
 * throw new EncryptionError('Invalid encryption key');
 * ```
 */
export class EncryptionError extends ConfigError {
  /**
   * Creates a new EncryptionError instance.
   *
   * @param message - Error message
   */
  constructor(message: string) {
    super(message, 'ENCRYPTION_ERROR');
    this.name = 'EncryptionError';
  }
}

/**
 * Thrown when plugin operations fail.
 *
 * @example
 * ```typescript
 * throw new PluginError('Failed to initialize plugin', 'yaml-parser');
 * ```
 */
export class PluginError extends ConfigError {
  /**
   * Creates a new PluginError instance.
   *
   * @param message - Error message
   * @param pluginName - Name of the plugin that caused the error
   */
  constructor(message: string, public readonly pluginName: string) {
    super(message, 'PLUGIN_ERROR', { pluginName });
    this.name = 'PluginError';
  }
}
