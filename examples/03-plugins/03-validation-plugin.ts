/**
 * Example 14: Configuration Validation
 *
 * This example demonstrates JSON Schema validation.
 */

import { loadConfig } from '@oxog/config';
import { validationPlugin } from '@oxog/config/plugins';

async function main() {
  const config = await loadConfig({
    name: 'myapp',
    paths: ['./config.json'],
  });

  // Add validation plugin
  config.use(validationPlugin({
    schema: {
      type: 'object',
      properties: {
        port: {
          type: 'number',
          minimum: 1,
          maximum: 65535,
          errorMessage: 'Port must be between 1 and 65535'
        },
        host: {
          type: 'string',
          pattern: '^[a-zA-Z0-9.-]+$',
          errorMessage: 'Host must be a valid hostname'
        },
        database: {
          type: 'object',
          properties: {
            host: { type: 'string' },
            port: { type: 'number' },
          },
          required: ['host', 'port'],
        },
      },
      required: ['port', 'host'],
      additionalProperties: false,
    },
  }));

  // Validation happens automatically
  try {
    const isValid = await config.validate();
    console.log('Configuration is valid:', isValid);
  } catch (error) {
    console.error('Validation failed:', error.message);
  }
}

main().catch(console.error);
