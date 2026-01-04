/**
 * Plugin exports for @oxog/config
 */

// Core plugins (always available)
export { jsonParserPlugin } from './core/json-parser.js';
export { envParserPlugin } from './core/env-parser.js';
export { mergePlugin } from './core/merge.js';
export { defaultsPlugin } from './core/defaults.js';

// Optional plugins
export { yamlParserPlugin } from './optional/yaml-parser.js';
export { tomlParserPlugin } from './optional/toml-parser.js';
export { iniParserPlugin } from './optional/ini-parser.js';
export { validationPlugin } from './optional/validation.js';
export { encryptionPlugin } from './optional/encryption.js';
export { watchPlugin } from './optional/watch.js';
export { cachePlugin } from './optional/cache.js';
export { interpolationPlugin } from './optional/interpolation.js';

// Default exports
export { default as jsonParser } from './core/json-parser.js';
export { default as envParser } from './core/env-parser.js';
export { default as merge } from './core/merge.js';
export { default as defaults } from './core/defaults.js';

export { default as yamlParser } from './optional/yaml-parser.js';
export { default as tomlParser } from './optional/toml-parser.js';
export { default as iniParser } from './optional/ini-parser.js';
export { default as validation } from './optional/validation.js';
export { default as encryption } from './optional/encryption.js';
export { default as watch } from './optional/watch.js';
export { default as cache } from './optional/cache.js';
export { default as interpolation } from './optional/interpolation.js';
