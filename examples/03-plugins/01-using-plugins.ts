/**
 * Example 7: Using Plugins
 *
 * This example shows how to use and create plugins.
 */

import { loadConfig } from '@oxog/config';
import { yamlParserPlugin, validationPlugin } from '@oxog/config/plugins';

async function main() {
  const config = await loadConfig({
    name: 'myapp',
    paths: ['./config.yaml'],  // YAML format
  });

  // Add YAML support
  config.use(yamlParserPlugin());

  // Add validation
  config.use(validationPlugin({
    schema: {
      type: 'object',
      properties: {
        port: { type: 'number', minimum: 1, maximum: 65535 },
        host: { type: 'string' },
      },
      required: ['port', 'host'],
    },
  }));

  // List installed plugins
  console.log('Installed plugins:', config.plugins());

  console.log('Config loaded:', config.toObject());
}

main().catch(console.error);
