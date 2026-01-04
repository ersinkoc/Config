/**
 * YAML parser plugin - optional plugin for YAML format support.
 */

import { yamlParser } from '../../parsers/yaml.js';
import type { ConfigKernel } from '../../kernel.js';
import type { ConfigPlugin } from '../../types.js';

/**
 * Creates the YAML parser plugin.
 *
 * @returns YAML parser plugin
 *
 * @example
 * ```typescript
 * const plugin = yamlParserPlugin();
 * config.use(plugin);
 * ```
 */
export function yamlParserPlugin(): ConfigPlugin {
  return {
    name: 'yaml-parser',
    version: '1.0.0',
    install(kernel: ConfigKernel) {
      // Register parser with kernel's parser registry
      // This is handled globally via parserRegistry
      return;
    },
  };
}

export default yamlParserPlugin();
