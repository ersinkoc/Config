/**
 * Example 16: Required Fields Validation
 *
 * This example demonstrates required field validation.
 */

import { loadConfig } from '@oxog/config';

async function main() {
  try {
    const config = await loadConfig({
      name: 'myapp',
      paths: ['./config.json'],
      required: [
        'database.host',
        'database.port',
        'apiKey',
      ],
    });

    console.log('All required fields are present');
    console.log('DB Host:', config.get('database.host'));
    console.log('API Key:', config.get('apiKey'));
  } catch (error) {
    if (error.name === 'RequiredFieldError') {
      console.error('Missing required field:', error.field);
      process.exit(1);
    }
    throw error;
  }
}

main().catch(console.error);
