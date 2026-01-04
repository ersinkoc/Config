/**
 * Defaults plugin - core plugin for default values and required fields.
 */

import type { ConfigKernel } from '../../kernel.js';
import type { ConfigPlugin } from '../../types.js';
import { RequiredFieldError } from '../../errors.js';
import { get } from '../../utils/path.js';

/**
 * Creates the defaults plugin.
 *
 * @param defaults - Default values
 * @param required - Required field paths
 * @returns Defaults plugin
 *
 * @example
 * ```typescript
 * const plugin = defaultsPlugin({
 *   port: 3000,
 *   host: 'localhost',
 * }, ['database.host']);
 * config.use(plugin);
 * ```
 */
export function defaultsPlugin(
  defaults?: Record<string, unknown>,
  required?: string[]
): ConfigPlugin {
  return {
    name: 'defaults',
    version: '1.0.0',
    install(kernel: ConfigKernel) {
      // Store defaults and required fields in kernel context
      (kernel.context as any).defaults = defaults || {};
      (kernel.context as any).required = required || [];
    },
    onAfterMerge(config: unknown) {
      const typedConfig = config as Record<string, unknown>;
      const pluginDefaults = defaults || {};
      const pluginRequired = required || [];

      // Apply defaults
      for (const [key, value] of Object.entries(pluginDefaults)) {
        if (typedConfig[key] === undefined) {
          typedConfig[key] = value;
        }
      }

      // Validate required fields
      for (const field of pluginRequired) {
        const value = get(typedConfig, field);
        if (value === undefined) {
          throw new RequiredFieldError(field);
        }
      }

      return typedConfig;
    },
  };
}

export default defaultsPlugin();
