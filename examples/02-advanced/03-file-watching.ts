/**
 * Example 6: File Watching and Hot Reload
 *
 * This example demonstrates how to watch configuration files
 * for changes and automatically reload.
 */

import { loadConfig } from '@oxog/config';

async function main() {
  const config = await loadConfig({
    name: 'myapp',
    paths: ['./config.yaml'],
    watch: true,
    watchOptions: {
      debounce: 300,  // Wait 300ms after changes
    },
  });

  // Register change handler
  config.on('change', (event) => {
    console.log('Configuration changed:', event);
    console.log('New port:', config.get('port'));
  });

  console.log('Watching for configuration changes...');
  console.log('Current port:', config.get('port'));

  // Keep process running
  process.on('SIGINT', () => {
    config.unwatch();
    process.exit(0);
  });
}

main().catch(console.error);
