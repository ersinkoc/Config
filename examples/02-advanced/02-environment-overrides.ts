/**
 * Example 5: Environment-Based Configuration Overrides
 *
 * This example shows how to use environment-specific configurations.
 */

import { loadConfig } from '@oxog/config';

async function main() {
  // Load configuration with environment support
  const config = await loadConfig({
    name: 'myapp',
    paths: ['./config.yaml'],
    env: process.env.NODE_ENV || 'development',
    environments: ['development', 'staging', 'production'],
  });

  // This will automatically load:
  // 1. config.yaml (base config)
  // 2. config.development.yaml (environment overrides)
  // 3. .env (environment variables)
  // 4. config.local.yaml (local overrides, gitignored)

  const port = config.get('port');
  const databaseUrl = config.get('database.url');

  console.log(`Running in ${process.env.NODE_ENV} mode`);
  console.log(`Port: ${port}`);
  console.log(`Database: ${databaseUrl}`);
}

main().catch(console.error);
