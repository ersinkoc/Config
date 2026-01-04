/**
 * Example 10: YAML Configuration Format
 *
 * This example demonstrates YAML configuration with advanced features.
 */

import { loadConfig } from '@oxog/config';
import { yamlParserPlugin } from '@oxog/config/plugins';

async function main() {
  const config = await loadConfig({
    name: 'myapp',
    paths: ['./config.yaml'],
  });

  // Add YAML support
  config.use(yamlParserPlugin());

  // YAML supports advanced features like anchors and aliases
  const server1 = config.get('server1');
  const server2 = config.get('server2');  // Uses alias

  console.log('Server 1:', server1);
  console.log('Server 2:', server2);  // Same as server1

  // Multi-line strings
  const description = config.get('description');
  console.log('Description:', description);
}

main().catch(console.error);
