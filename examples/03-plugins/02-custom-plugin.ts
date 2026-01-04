/**
 * Example 8: Creating Custom Plugins
 *
 * This example demonstrates how to create a custom plugin.
 */

import { loadConfig, type ConfigPlugin } from '@oxog/config';

// Define a custom plugin
const myCustomPlugin: ConfigPlugin = {
  name: 'my-custom-plugin',
  version: '1.0.0',
  description: 'A custom plugin for logging',

  install(kernel) {
    // Register event handler
    kernel.on('config:loaded', (data) => {
      console.log('[Custom Plugin] Config loaded:', data);
    });

    // Add custom method to config
    kernel.events.on('config:get', (path) => {
      console.log(`[Custom Plugin] Getting config at path: ${path}`);
    });
  },
};

async function main() {
  const config = await loadConfig({
    name: 'myapp',
    paths: ['./config.yaml'],
  });

  // Install custom plugin
  config.use(myCustomPlugin);

  console.log('Plugin installed:', config.plugins());
}

main().catch(console.error);
