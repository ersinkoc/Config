/**
 * JSON parser plugin - core plugin for JSON format support.
 */

import { jsonParser } from '../../parsers/json.js';
import type { ConfigKernel } from '../../kernel.js';
import type { ConfigPlugin } from '../../types.js';

/**
 * Creates the JSON parser plugin.
 *
 * @returns JSON parser plugin
 *
 * @example
 * ```typescript
 * const plugin = jsonParserPlugin();
 * config.use(plugin);
 * ```
 */
export function jsonParserPlugin(): ConfigPlugin {
  return {
    name: 'json-parser',
    version: '1.0.0',
    install(kernel: ConfigKernel) {
      // Register parser with kernel's parser registry
      // This is handled globally via parserRegistry
      return;
    },
  };
}

export default jsonParserPlugin();
