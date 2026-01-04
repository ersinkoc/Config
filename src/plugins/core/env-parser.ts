/**
 * ENV parser plugin - core plugin for ENV format support.
 */

import { envParser } from '../../parsers/env.js';
import type { ConfigKernel } from '../../kernel.js';
import type { ConfigPlugin } from '../../types.js';

/**
 * Creates the ENV parser plugin.
 *
 * @returns ENV parser plugin
 *
 * @example
 * ```typescript
 * const plugin = envParserPlugin();
 * config.use(plugin);
 * ```
 */
export function envParserPlugin(): ConfigPlugin {
  return {
    name: 'env-parser',
    version: '1.0.0',
    install(kernel: ConfigKernel) {
      // Register parser with kernel's parser registry
      // This is handled globally via parserRegistry
      return;
    },
  };
}

export default envParserPlugin();
