/**
 * Tests for PluginManager implementation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginManager } from '../../../src/kernel/plugins.js';
import { PluginError } from '../../../src/errors.js';
import type { ConfigKernel, ConfigPlugin } from '../../../src/types.js';

// Mock kernel
function createMockKernel(): ConfigKernel {
  return {
    plugins: {} as any,
    events: {} as any,
    cache: {} as any,
    fs: {} as any,
    context: { env: 'test' },
    getPlugin: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    initialize: vi.fn(),
    shutdown: vi.fn(),
  };
}

// Create a test plugin
function createTestPlugin(
  name: string,
  version: string = '1.0.0',
  dependencies?: string[],
  installFn?: (kernel: ConfigKernel) => void
): ConfigPlugin {
  return {
    name,
    version,
    dependencies,
    install: installFn || vi.fn(),
  };
}

describe('PluginManager', () => {
  let manager: PluginManager;
  let kernel: ConfigKernel;

  beforeEach(() => {
    kernel = createMockKernel();
    manager = new PluginManager(kernel);
  });

  describe('register', () => {
    it('should register a plugin', () => {
      const plugin = createTestPlugin('test-plugin');
      manager.register(plugin);
      expect(manager.has('test-plugin')).toBe(true);
    });

    it('should throw when registering duplicate plugin', () => {
      const plugin = createTestPlugin('test-plugin');
      manager.register(plugin);
      expect(() => manager.register(plugin)).toThrow(PluginError);
      expect(() => manager.register(plugin)).toThrow("Plugin 'test-plugin' is already registered");
    });
  });

  describe('unregister', () => {
    it('should unregister a plugin', () => {
      const plugin = createTestPlugin('test-plugin');
      manager.register(plugin);
      manager.unregister('test-plugin');
      expect(manager.has('test-plugin')).toBe(false);
    });

    it('should remove from installed set when unregistering', () => {
      const plugin = createTestPlugin('test-plugin');
      manager.use(plugin);
      manager.unregister('test-plugin');
      expect(manager.isInstalled('test-plugin')).toBe(false);
    });

    it('should not throw when unregistering non-existent plugin', () => {
      expect(() => manager.unregister('nonexistent')).not.toThrow();
    });
  });

  describe('use', () => {
    it('should install plugin and call install method', () => {
      const installFn = vi.fn();
      const plugin = createTestPlugin('test-plugin', '1.0.0', undefined, installFn);

      manager.use(plugin);

      expect(installFn).toHaveBeenCalledWith(kernel);
      expect(manager.isInstalled('test-plugin')).toBe(true);
    });

    it('should register plugin if not registered', () => {
      const plugin = createTestPlugin('test-plugin');

      expect(manager.has('test-plugin')).toBe(false);
      manager.use(plugin);
      expect(manager.has('test-plugin')).toBe(true);
    });

    it('should not re-install already installed plugin', () => {
      const installFn = vi.fn();
      const plugin = createTestPlugin('test-plugin', '1.0.0', undefined, installFn);

      manager.use(plugin);
      manager.use(plugin);

      expect(installFn).toHaveBeenCalledTimes(1);
    });

    it('should install dependencies first', () => {
      const order: string[] = [];
      const dep1 = createTestPlugin('dep1', '1.0.0', undefined, () => order.push('dep1'));
      const dep2 = createTestPlugin('dep2', '1.0.0', ['dep1'], () => order.push('dep2'));
      const main = createTestPlugin('main', '1.0.0', ['dep1', 'dep2'], () => order.push('main'));

      manager.register(dep1);
      manager.register(dep2);
      manager.use(main);

      expect(order).toEqual(['dep1', 'dep2', 'main']);
    });

    it('should throw when dependency is missing', () => {
      const plugin = createTestPlugin('test-plugin', '1.0.0', ['missing-dep']);

      expect(() => manager.use(plugin)).toThrow(PluginError);
      expect(() => manager.use(plugin)).toThrow("Missing dependency 'missing-dep'");
    });

    it('should throw when install fails', () => {
      const plugin = createTestPlugin('test-plugin', '1.0.0', undefined, () => {
        throw new Error('Install failed');
      });

      expect(() => manager.use(plugin)).toThrow(PluginError);
      expect(() => manager.use(plugin)).toThrow("Failed to install plugin 'test-plugin'");
    });

    it('should not reinstall already installed dependencies', () => {
      const installFn = vi.fn();
      const dep = createTestPlugin('dep', '1.0.0', undefined, installFn);
      const main = createTestPlugin('main', '1.0.0', ['dep']);

      manager.use(dep);
      manager.use(main);

      expect(installFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('list', () => {
    it('should return empty array when no plugins', () => {
      expect(manager.list()).toEqual([]);
    });

    it('should return all registered plugin names', () => {
      manager.register(createTestPlugin('plugin1'));
      manager.register(createTestPlugin('plugin2'));
      manager.register(createTestPlugin('plugin3'));

      const list = manager.list();
      expect(list).toContain('plugin1');
      expect(list).toContain('plugin2');
      expect(list).toContain('plugin3');
      expect(list).toHaveLength(3);
    });
  });

  describe('listInstalled', () => {
    it('should return empty array when no plugins installed', () => {
      expect(manager.listInstalled()).toEqual([]);
    });

    it('should return only installed plugin names', () => {
      manager.register(createTestPlugin('plugin1'));
      manager.register(createTestPlugin('plugin2'));
      manager.use(createTestPlugin('plugin3'));

      const installed = manager.listInstalled();
      expect(installed).toContain('plugin3');
      expect(installed).not.toContain('plugin1');
      expect(installed).not.toContain('plugin2');
    });
  });

  describe('get', () => {
    it('should return plugin by name', () => {
      const plugin = createTestPlugin('test-plugin');
      manager.register(plugin);

      expect(manager.get('test-plugin')).toBe(plugin);
    });

    it('should return undefined for non-existent plugin', () => {
      expect(manager.get('nonexistent')).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for registered plugin', () => {
      manager.register(createTestPlugin('test-plugin'));
      expect(manager.has('test-plugin')).toBe(true);
    });

    it('should return false for non-existent plugin', () => {
      expect(manager.has('nonexistent')).toBe(false);
    });
  });

  describe('isInstalled', () => {
    it('should return true for installed plugin', () => {
      manager.use(createTestPlugin('test-plugin'));
      expect(manager.isInstalled('test-plugin')).toBe(true);
    });

    it('should return false for registered but not installed plugin', () => {
      manager.register(createTestPlugin('test-plugin'));
      expect(manager.isInstalled('test-plugin')).toBe(false);
    });

    it('should return false for non-existent plugin', () => {
      expect(manager.isInstalled('nonexistent')).toBe(false);
    });
  });

  describe('getInfo', () => {
    it('should return plugin info', () => {
      const plugin = createTestPlugin('test-plugin', '2.0.0', ['dep1', 'dep2']);
      manager.register(plugin);

      const info = manager.getInfo('test-plugin');
      expect(info).toEqual({
        name: 'test-plugin',
        version: '2.0.0',
        dependencies: ['dep1', 'dep2'],
      });
    });

    it('should return undefined for non-existent plugin', () => {
      expect(manager.getInfo('nonexistent')).toBeUndefined();
    });

    it('should handle plugin without dependencies', () => {
      const plugin = createTestPlugin('test-plugin', '1.0.0');
      manager.register(plugin);

      const info = manager.getInfo('test-plugin');
      expect(info?.dependencies).toBeUndefined();
    });
  });

  describe('getDependencyTree', () => {
    it('should return empty object when no plugins', () => {
      expect(manager.getDependencyTree()).toEqual({});
    });

    it('should return dependency tree for all plugins', () => {
      manager.register(createTestPlugin('plugin1', '1.0.0', []));
      manager.register(createTestPlugin('plugin2', '2.0.0', ['plugin1']));
      manager.register(createTestPlugin('plugin3', '3.0.0', ['plugin1', 'plugin2']));

      const tree = manager.getDependencyTree();
      expect(tree).toEqual({
        plugin1: { name: 'plugin1', version: '1.0.0', dependencies: [] },
        plugin2: { name: 'plugin2', version: '2.0.0', dependencies: ['plugin1'] },
        plugin3: { name: 'plugin3', version: '3.0.0', dependencies: ['plugin1', 'plugin2'] },
      });
    });

    it('should handle plugins without dependencies array', () => {
      manager.register(createTestPlugin('plugin1', '1.0.0'));

      const tree = manager.getDependencyTree();
      expect(tree.plugin1.dependencies).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all plugins', () => {
      manager.use(createTestPlugin('plugin1'));
      manager.use(createTestPlugin('plugin2'));

      manager.clear();

      expect(manager.list()).toEqual([]);
      expect(manager.listInstalled()).toEqual([]);
    });
  });
});
