/**
 * Example 3: Programmatic Configuration Creation
 *
 * This example shows how to create configuration programmatically.
 */

import { createConfig } from '@oxog/config';

function main() {
  // Create configuration programmatically
  const config = createConfig({
    port: 3000,
    host: 'localhost',
    database: {
      host: 'localhost',
      port: 5432,
      name: 'myapp',
    },
    features: {
      authentication: true,
      caching: true,
      logging: false,
    },
  });

  // Get values
  console.log('Port:', config.get('port'));
  console.log('DB Host:', config.get('database.host'));

  // Set new values
  config.set('port', 4000);
  console.log('Updated Port:', config.get('port'));

  // Check if path exists
  console.log('Has port?', config.has('port')); // true
  console.log('Has missing?', config.has('missing')); // false

  // Delete values
  config.delete('logging');
  console.log('Has logging?', config.has('features.logging')); // false

  // Convert to object/JSON
  console.log('Config object:', config.toObject());
  console.log('Config JSON:', config.toJSON());
}

main();
