/**
 * Example 9: JSON Configuration Format
 *
 * This example shows how to use JSON format for configuration.
 */

import { loadConfig } from '@oxog/config';

async function main() {
  // JSON is supported by default (no plugin needed)
  const config = await loadConfig({
    name: 'myapp',
    paths: ['./config.json'],
  });

  const settings = config.get('settings');
  console.log('Settings:', settings);

  // Access nested values
  const dbHost = config.get('database.host');
  console.log('Database host:', dbHost);
}

main().catch(console.error);
