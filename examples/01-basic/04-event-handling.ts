/**
 * Example 15: Event Handling
 *
 * This example shows how to listen to configuration events.
 */

import { loadConfig } from '@oxog/config';

async function main() {
  const config = await loadConfig({
    name: 'myapp',
    paths: ['./config.yaml'],
    watch: true,
  });

  // Listen to configuration change events
  config.on('change', (event) => {
    console.log('Configuration changed!');
    console.log('Changed path:', event.path);
    console.log('Old value:', event.oldValue);
    console.log('New value:', event.newValue);
  });

  // Listen to specific path changes
  config.on('port:change', (value) => {
    console.log('Port changed to:', value);
    // Restart server, etc.
  });

  // Listen to config loaded event
  config.on('loaded', () => {
    console.log('Configuration loaded successfully');
  });

  // Modify configuration to trigger events
  setTimeout(() => {
    config.set('port', 4000);
  }, 1000);

  console.log('Listening for configuration events...');
}

main().catch(console.error);
