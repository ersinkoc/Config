/**
 * Tests for plugins index exports.
 */

import { describe, it, expect } from 'vitest';
import {
  // Core plugins
  jsonParserPlugin,
  envParserPlugin,
  mergePlugin,
  defaultsPlugin,
  // Optional plugins
  yamlParserPlugin,
  tomlParserPlugin,
  iniParserPlugin,
  validationPlugin,
  encryptionPlugin,
  watchPlugin,
  cachePlugin,
  interpolationPlugin,
  // Default exports
  jsonParser,
  envParser,
  merge,
  defaults,
  yamlParser,
  tomlParser,
  iniParser,
  validation,
  encryption,
  watch,
  cache,
  interpolation,
} from '../../../src/plugins/index.js';

describe('Plugins Index', () => {
  describe('Core plugins exports', () => {
    it('should export jsonParserPlugin function', () => {
      expect(typeof jsonParserPlugin).toBe('function');
      const plugin = jsonParserPlugin();
      expect(plugin.name).toBe('json-parser');
    });

    it('should export envParserPlugin function', () => {
      expect(typeof envParserPlugin).toBe('function');
      const plugin = envParserPlugin();
      expect(plugin.name).toBe('env-parser');
    });

    it('should export mergePlugin function', () => {
      expect(typeof mergePlugin).toBe('function');
      const plugin = mergePlugin();
      expect(plugin.name).toBe('merge');
    });

    it('should export defaultsPlugin function', () => {
      expect(typeof defaultsPlugin).toBe('function');
      const plugin = defaultsPlugin();
      expect(plugin.name).toBe('defaults');
    });
  });

  describe('Optional plugins exports', () => {
    it('should export yamlParserPlugin function', () => {
      expect(typeof yamlParserPlugin).toBe('function');
      const plugin = yamlParserPlugin();
      expect(plugin.name).toBe('yaml-parser');
    });

    it('should export tomlParserPlugin function', () => {
      expect(typeof tomlParserPlugin).toBe('function');
      const plugin = tomlParserPlugin();
      expect(plugin.name).toBe('toml-parser');
    });

    it('should export iniParserPlugin function', () => {
      expect(typeof iniParserPlugin).toBe('function');
      const plugin = iniParserPlugin();
      expect(plugin.name).toBe('ini-parser');
    });

    it('should export validationPlugin function', () => {
      expect(typeof validationPlugin).toBe('function');
      const plugin = validationPlugin({ schema: {} });
      expect(plugin.name).toBe('validation');
    });

    it('should export encryptionPlugin function', () => {
      expect(typeof encryptionPlugin).toBe('function');
      const plugin = encryptionPlugin({ key: 'secret' });
      expect(plugin.name).toBe('encryption');
    });

    it('should export watchPlugin function', () => {
      expect(typeof watchPlugin).toBe('function');
      const plugin = watchPlugin();
      expect(plugin.name).toBe('watch');
    });

    it('should export cachePlugin function', () => {
      expect(typeof cachePlugin).toBe('function');
      const plugin = cachePlugin({});
      expect(plugin.name).toBe('cache');
    });

    it('should export interpolationPlugin function', () => {
      expect(typeof interpolationPlugin).toBe('function');
      const plugin = interpolationPlugin();
      expect(plugin.name).toBe('interpolation');
    });
  });

  describe('Default exports', () => {
    it('should export jsonParser instance', () => {
      expect(jsonParser).toBeDefined();
      expect(jsonParser.name).toBe('json-parser');
    });

    it('should export envParser instance', () => {
      expect(envParser).toBeDefined();
      expect(envParser.name).toBe('env-parser');
    });

    it('should export merge instance', () => {
      expect(merge).toBeDefined();
      expect(merge.name).toBe('merge');
    });

    it('should export defaults instance', () => {
      expect(defaults).toBeDefined();
      expect(defaults.name).toBe('defaults');
    });

    it('should export yamlParser instance', () => {
      expect(yamlParser).toBeDefined();
      expect(yamlParser.name).toBe('yaml-parser');
    });

    it('should export tomlParser instance', () => {
      expect(tomlParser).toBeDefined();
      expect(tomlParser.name).toBe('toml-parser');
    });

    it('should export iniParser instance', () => {
      expect(iniParser).toBeDefined();
      expect(iniParser.name).toBe('ini-parser');
    });

    it('should export validation instance', () => {
      expect(validation).toBeDefined();
      expect(validation.name).toBe('validation');
    });

    it('should export encryption instance', () => {
      expect(encryption).toBeDefined();
      expect(encryption.name).toBe('encryption');
    });

    it('should export watch instance', () => {
      expect(watch).toBeDefined();
      expect(watch.name).toBe('watch');
    });

    it('should export cache instance', () => {
      expect(cache).toBeDefined();
      expect(cache.name).toBe('cache');
    });

    it('should export interpolation instance', () => {
      expect(interpolation).toBeDefined();
      expect(interpolation.name).toBe('interpolation');
    });
  });
});
