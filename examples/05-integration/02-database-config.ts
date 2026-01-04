/**
 * Example 13: Database Configuration
 *
 * This example shows how to handle database configuration.
 */

import { loadConfig } from '@oxog/config';
import { createClient } from 'database-client'; // Example

async function main() {
  const config = await loadConfig({
    name: 'myapp',
    paths: ['./config.yaml'],
  });

  // Get database configuration
  const dbConfig = {
    host: config.get('database.host'),
    port: config.get('database.port'),
    username: config.get('database.username'),
    password: config.get('database.password'),
    ssl: config.get('database.ssl', false),
  };

  // Create database connection
  const db = createClient(dbConfig);

  // Use environment-specific settings
  if (config.get('database.pool.enabled', true)) {
    db.configurePool({
      min: config.get('database.pool.min', 2),
      max: config.get('database.pool.max', 10),
    });
  }

  console.log('Database configured:', dbConfig);
}

main().catch(console.error);
