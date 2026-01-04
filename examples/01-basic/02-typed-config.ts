/**
 * Example 2: Type-Safe Configuration
 *
 * This example shows how to use TypeScript generics for type safety.
 */

import { loadConfig } from '@oxog/config';

interface AppConfig {
  port: number;
  host: string;
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
  };
  ssl: boolean;
}

async function main() {
  // Load with type safety
  const config = await loadConfig<AppConfig>({
    name: 'myapp',
    paths: ['./config.json'],
  });

  // TypeScript will enforce types
  const port: number = config.get('port'); // ✅ Type: number
  const host: string = config.get('host'); // ✅ Type: string
  const dbHost: string = config.get('database.host'); // ✅ Type: string

  // Type checking prevents errors
  // const invalid: number = config.get('host'); // ❌ TypeScript error!

  console.log(`Port: ${port}, Host: ${host}`);
  console.log(`Database: ${dbHost}`);
}

main().catch(console.error);
