/**
 * Example 1: Simple Configuration Loading
 *
 * This example demonstrates the most basic usage of @oxog/config.
 */

import { loadConfig } from '@oxog/config';

async function main() {
  // Load configuration from default locations
  const config = await loadConfig({
    name: 'myapp',
    env: process.env.NODE_ENV || 'development',
  });

  // Access configuration values
  const port = config.get('port');
  const host = config.get('host', 'localhost'); // with default value

  console.log(`Server running on ${host}:${port}`);
}

main().catch(console.error);
