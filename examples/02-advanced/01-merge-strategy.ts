/**
 * Example 4: Custom Merge Strategies
 *
 * This example demonstrates how to use different merge strategies
 * for combining configuration values.
 */

import { loadConfig } from '@oxog/config';

async function main() {
  const config = await loadConfig({
    name: 'myapp',
    paths: ['./config.yaml', './config.local.yaml'],
    mergeStrategy: {
      default: 'merge',      // Default strategy for objects
      arrays: 'unique',      // Strategy for arrays (unique items)
      paths: {
        'server.plugins': 'append',  // Append to plugins array
        'database.seeds': 'prepend', // Prepend to seeds
        'overrides': 'replace',      // Replace completely
      },
    },
  });

  // The config will be merged using the specified strategies
  console.log('Merged config:', config.toObject());
}

main().catch(console.error);
