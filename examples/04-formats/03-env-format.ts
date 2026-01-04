/**
 * Example 11: ENV Configuration Format
 *
 * This example shows ENV format with variable expansion.
 */

import { loadConfig } from '@oxog/config';
import { envParserPlugin } from '@oxog/config/plugins';

async function main() {
  const config = await loadConfig({
    name: 'myapp',
    paths: ['./.env'],
  });

  // ENV parser is included by default
  const port = config.get('PORT');
  const dbHost = config.get('DATABASE_HOST');

  console.log('Port:', port);
  console.log('DB Host:', dbHost);

  // Variable expansion is supported
  const dbUrl = config.get('DATABASE_URL');
  console.log('DB URL:', dbUrl);  // Resolves ${DB_HOST}:${DB_PORT}

  // Default values
  const apiKey = config.get('API_KEY', 'default-key');
  console.log('API Key:', apiKey);
}

main().catch(console.error);
