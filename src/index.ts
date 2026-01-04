/**
 * Main entry point for @oxog/config
 *
 * @example
 * ```typescript
 * import { loadConfig } from '@oxog/config';
 *
 * const config = await loadConfig({
 *   name: 'myapp',
 *   paths: ['./config.yaml'],
 * });
 *
 * const port = config.get('port');
 * ```
 */

// Re-export types
export type {
  LoadOptions,
  Config,
  MergeStrategyOptions,
  ConfigEvent,
  ConfigChangeEvent,
  WatchOptions,
  ValidationIssue,
  FileWatchEvent,
  ConfigContext,
  ConfigPlugin,
  PluginEventHandler,
  ConfigParser,
  MergeStrategy,
  EventHandler,
} from './types.js';

// Re-export errors
export {
  ConfigError,
  ConfigNotFoundError,
  ParseError,
  ValidationError,
  RequiredFieldError,
  EncryptionError,
  PluginError,
} from './errors.js';

// Re-export utilities
export { get, set, has, deletePath, deepClone, getAllPaths } from './utils/path.js';
export { merge, mergeConfigs, selectStrategy, mergeArrays } from './utils/deep-merge.js';
export {
  readFile,
  exists,
  resolvePaths,
  findConfigFiles,
  detectFormat,
  watchFile,
} from './utils/file.js';
export {
  encrypt,
  decrypt,
  isEncrypted,
  encryptObject,
  decryptObject,
  generateSalt,
  generateIV,
  deriveKey,
  hashString,
  validateOptions,
} from './utils/crypto.js';

// Re-export parsers
export { parserRegistry } from './parsers/index.js';
export { jsonParser } from './parsers/json.js';
export { yamlParser } from './parsers/yaml.js';
export { tomlParser } from './parsers/toml.js';
export { iniParser } from './parsers/ini.js';
export { envParser } from './parsers/env.js';

// Re-export kernel
export { createKernel } from './kernel.js';
export type { ConfigKernel } from './kernel.js';

// Re-export Config class
export { ConfigImpl, createConfigInstance } from './config.js';

//==============================================================================
// Main API Functions
//==============================================================================

import { createConfigInstance } from './config.js';
import type { LoadOptions, Config } from './types.js';

/**
 * Loads configuration from files.
 *
 * @typeParam T - Configuration type
 * @param options - Load options
 * @returns Configuration instance
 *
 * @example
 * ```typescript
 * const config = await loadConfig({
 *   name: 'myapp',
 *   paths: ['./config.yaml'],
 *   env: 'development',
 * });
 *
 * const port = config.get('port');
 * ```
 */
export async function loadConfig<T = unknown>(options: LoadOptions): Promise<Config<T>> {
  const config = createConfigInstance<T>(options);
  await config.load();
  return config;
}

/**
 * Creates a configuration instance programmatically.
 *
 * @typeParam T - Configuration type
 * @param data - Initial configuration data
 * @returns Configuration instance
 *
 * @example
 * ```typescript
 * const config = createConfig({
 *   port: 3000,
 *   host: 'localhost',
 * });
 *
 * config.set('port', 4000);
 * const port = config.get('port'); // 4000
 * ```
 */
export function createConfig<T = unknown>(data: Record<string, unknown>): Config<T> {
  const config = createConfigInstance<T>({
    name: 'app',
    defaults: data,
  });

  // Set the data directly
  (config as any).data = { ...data };

  return config;
}

/**
 * Defines a typed configuration schema.
 *
 * @typeParam T - Configuration type
 * @param data - Configuration schema
 * @returns Configuration data
 *
 * @example
 * ```typescript
 * interface AppConfig {
 *   port: number;
 *   host: string;
 * }
 *
 * const configSchema = defineConfig<AppConfig>({
 *   port: 3000,
 *   host: 'localhost',
 * });
 * ```
 */
export function defineConfig<T = unknown>(data: Record<string, unknown>): Record<string, unknown> {
  return data;
}

//==============================================================================
// Version
//==============================================================================

export const VERSION = '1.0.0';

//==============================================================================
// Default export
//==============================================================================

export default {
  loadConfig,
  createConfig,
  defineConfig,
  VERSION,
};
