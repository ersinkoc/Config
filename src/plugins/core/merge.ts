/**
 * Merge plugin - core plugin for configuration merging.
 */

import type { ConfigKernel } from '../../kernel.js';
import type { ConfigPlugin } from '../../types.js';
import type { MergeStrategyOptions } from '../../types.js';

/**
 * Creates the merge plugin with custom strategies.
 *
 * @param strategies - Merge strategy options
 * @returns Merge plugin
 *
 * @example
 * ```typescript
 * const plugin = mergePlugin({
 *   default: 'merge',
 *   arrays: 'unique',
 * });
 * config.use(plugin);
 * ```
 */
export function mergePlugin(strategies?: MergeStrategyOptions): ConfigPlugin {
  return {
    name: 'merge',
    version: '1.0.0',
    install(kernel: ConfigKernel) {
      // Store strategies in kernel context
      (kernel.context as any).mergeStrategies = strategies || {
        default: 'merge',
        arrays: 'replace',
      };
    },
    onAfterMerge(config: unknown) {
      // Apply merge strategies if needed
      // The actual merging is done in the Config class
      return config;
    },
  };
}

export default mergePlugin();
