/**
 * Validation plugin - validates configuration against a JSON Schema.
 */

import type { ConfigKernel } from '../../kernel.js';
import type { ConfigPlugin } from '../../types.js';
import { ValidationError } from '../../errors.js';
import type { ValidationIssue } from '../../errors.js';

/**
 * Validation plugin options.
 */
export interface ValidationOptions {
  /** JSON Schema for validation */
  schema: Record<string, unknown>;
}

/**
 * Creates the validation plugin.
 *
 * @param options - Validation options
 * @returns Validation plugin
 *
 * @example
 * ```typescript
 * const plugin = validationPlugin({
 *   schema: {
 *     type: 'object',
 *     properties: {
 *       port: { type: 'number' }
 *     }
 *   }
 * });
 * config.use(plugin);
 * ```
 */
export function validationPlugin(options: ValidationOptions): ConfigPlugin {
  const { schema } = options;

  return {
    name: 'validation',
    version: '1.0.0',
    install(kernel: ConfigKernel) {
      // Store schema in kernel context
      (kernel.context as any).validationSchema = schema;
    },
    onAfterMerge(config: unknown) {
      const errors = validateSchema(config, schema);

      if (errors.length > 0) {
        throw new ValidationError('Configuration validation failed', errors);
      }

      return config;
    },
  };
}

/**
 * Validates data against a JSON Schema.
 *
 * @param data - Data to validate
 * @param schema - JSON Schema
 * @returns Array of validation errors
 */
function validateSchema(data: unknown, schema: Record<string, unknown>): ValidationIssue[] {
  const errors: ValidationIssue[] = [];

  // Type validation
  const expectedType = schema.type as string | undefined;
  if (expectedType) {
    const actualType = getType(data);
    if (expectedType !== actualType) {
      errors.push({
        path: '',
        message: `Expected type '${expectedType}', got '${actualType}'`,
        expected: expectedType,
        actual: actualType,
      });
      return errors; // Stop if root type is wrong
    }
  }

  // Properties validation
  const properties = schema.properties as Record<string, unknown> | undefined;
  if (properties && typeof data === 'object' && data !== null && !Array.isArray(data)) {
    for (const [key, schemaProp] of Object.entries(properties)) {
      const value = (data as Record<string, unknown>)[key];
      const propErrors = validateProperty(key, value, schemaProp as Record<string, unknown>);
      errors.push(...propErrors);
    }
  }

  // Required fields
  const required = schema.required as string[] | undefined;
  if (required && typeof data === 'object' && data !== null && !Array.isArray(data)) {
    for (const field of required) {
      if (!(field in data)) {
        errors.push({
          path: field,
          message: `Required field '${field}' is missing`,
          expected: 'any value',
          actual: 'undefined',
        });
      }
    }
  }

  return errors;
}

/**
 * Validates a single property.
 *
 * @param path - Property path
 * @param value - Property value
 * @param schema - Property schema
 * @returns Array of validation errors
 */
function validateProperty(path: string, value: unknown, schema: Record<string, unknown>): ValidationIssue[] {
  const errors: ValidationIssue[] = [];

  // Type validation
  const expectedType = schema.type as string | undefined;
  if (expectedType) {
    const actualType = getType(value);
    if (expectedType !== actualType) {
      errors.push({
        path,
        message: `Expected type '${expectedType}', got '${actualType}'`,
        expected: expectedType,
        actual: actualType,
      });
      return errors;
    }
  }

  // Properties validation (for objects)
  const properties = schema.properties as Record<string, unknown> | undefined;
  if (properties && typeof value === 'object' && value !== null && !Array.isArray(value)) {
    for (const [key, schemaProp] of Object.entries(properties)) {
      const propValue = (value as Record<string, unknown>)[key];
      const propErrors = validateProperty(`${path}.${key}`, propValue, schemaProp as Record<string, unknown>);
      errors.push(...propErrors);
    }
  }

  // Required fields
  const required = schema.required as string[] | undefined;
  if (required && typeof value === 'object' && value !== null && !Array.isArray(value)) {
    for (const field of required) {
      if (!(field in value)) {
        errors.push({
          path: `${path}.${field}`,
          message: `Required field '${field}' is missing`,
          expected: 'any value',
          actual: 'undefined',
        });
      }
    }
  }

  return errors;
}

/**
 * Gets the type of a value.
 *
 * @param value - Value to check
 * @returns Type string
 */
function getType(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
}

export default validationPlugin({ schema: {} });
