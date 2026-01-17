// @ts-nocheck
/**
 * Tests for kernel/plugins.ts
 */

import { jest } from '@jest/globals';
import { PluginManager } from '../kernel/plugins.js';
import { PluginError } from '../errors.js';
import type { ConfigKernel, ConfigPlugin } from '../types.js';

// Mock kernel
const mockKernel = {
  plugins: {} as any,
  events: {} as any,
  cache: {} as any,
  fs: {} as any,
  context: { name: 'test', env: 'test', config: {} },
  getPlugin: jest.fn(),
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
} as unknown as ConfigKernel;

describe('PluginManager', () => {
  let pluginManager: PluginManager;

  beforeEach(() => {
    pluginManager = new PluginManager(mockKernel);
  });

  describe('register', () => {
    it('should register a plugin', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.register(plugin);

      expect(pluginManager.has('test-plugin')).toBe(true);
      expect(pluginManager.get('test-plugin')).toBe(plugin);
    });

    it('should throw error when registering duplicate plugin', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.register(plugin);

      expect(() => pluginManager.register(plugin)).toThrow(PluginError);
      expect(() => pluginManager.register(plugin)).toThrow('already registered');
    });

    it('should not install plugin on register', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.register(plugin);

      expect(plugin.install).not.toHaveBeenCalled();
      expect(pluginManager.isInstalled('test-plugin')).toBe(false);
    });

    it('should handle plugins with different names', () => {
      const plugin1: ConfigPlugin = {
        name: 'plugin-1',
        version: '1.0.0',
        install: jest.fn(),
      };
      const plugin2: ConfigPlugin = {
        name: 'plugin-2',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.register(plugin1);
      pluginManager.register(plugin2);

      expect(pluginManager.list()).toContain('plugin-1');
      expect(pluginManager.list()).toContain('plugin-2');
    });
  });

  describe('unregister', () => {
    it('should unregister a plugin', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.register(plugin);
      expect(pluginManager.has('test-plugin')).toBe(true);

      pluginManager.unregister('test-plugin');

      expect(pluginManager.has('test-plugin')).toBe(false);
      expect(pluginManager.get('test-plugin')).toBeUndefined();
    });

    it('should also remove from installed', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.register(plugin);
      pluginManager.use(plugin);

      expect(pluginManager.isInstalled('test-plugin')).toBe(true);

      pluginManager.unregister('test-plugin');

      expect(pluginManager.isInstalled('test-plugin')).toBe(false);
    });

    it('should handle unregistering non-existent plugin', () => {
      expect(() => pluginManager.unregister('nonexistent')).not.toThrow();
    });

    it('should not affect other plugins', () => {
      const plugin1: ConfigPlugin = {
        name: 'plugin-1',
        version: '1.0.0',
        install: jest.fn(),
      };
      const plugin2: ConfigPlugin = {
        name: 'plugin-2',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.register(plugin1);
      pluginManager.register(plugin2);

      pluginManager.unregister('plugin-1');

      expect(pluginManager.has('plugin-1')).toBe(false);
      expect(pluginManager.has('plugin-2')).toBe(true);
    });
  });

  describe('use', () => {
    it('should register and install a plugin', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.use(plugin);

      expect(pluginManager.has('test-plugin')).toBe(true);
      expect(pluginManager.isInstalled('test-plugin')).toBe(true);
      expect(plugin.install).toHaveBeenCalledWith(mockKernel);
    });

    it('should not install plugin twice', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.use(plugin);
      pluginManager.use(plugin);

      expect(plugin.install).toHaveBeenCalledTimes(1);
    });

    it('should throw error for missing dependency', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        dependencies: ['missing-dep'],
        install: jest.fn(),
      };

      expect(() => pluginManager.use(plugin)).toThrow(PluginError);
      expect(() => pluginManager.use(plugin)).toThrow('Missing dependency');
    });

    it('should install dependencies before plugin', () => {
      const installOrder: string[] = [];

      const depPlugin: ConfigPlugin = {
        name: 'dep-plugin',
        version: '1.0.0',
        install: jest.fn(() => {
          installOrder.push('dep');
        }),
      };

      const mainPlugin: ConfigPlugin = {
        name: 'main-plugin',
        version: '1.0.0',
        dependencies: ['dep-plugin'],
        install: jest.fn(() => {
          installOrder.push('main');
        }),
      };

      pluginManager.register(depPlugin);
      pluginManager.use(mainPlugin);

      expect(installOrder).toEqual(['dep', 'main']);
    });

    it('should handle nested dependencies', () => {
      const installOrder: string[] = [];

      const plugin1: ConfigPlugin = {
        name: 'plugin-1',
        version: '1.0.0',
        install: jest.fn(() => installOrder.push('1')),
      };

      const plugin2: ConfigPlugin = {
        name: 'plugin-2',
        version: '1.0.0',
        dependencies: ['plugin-1'],
        install: jest.fn(() => installOrder.push('2')),
      };

      const plugin3: ConfigPlugin = {
        name: 'plugin-3',
        version: '1.0.0',
        dependencies: ['plugin-2'],
        install: jest.fn(() => installOrder.push('3')),
      };

      // Register all plugins first
      pluginManager.register(plugin1);
      pluginManager.register(plugin2);
      pluginManager.register(plugin3);

      // Use plugin3 which should install all dependencies
      pluginManager.use(plugin3);

      expect(installOrder).toEqual(['1', '2', '3']);
    });

    it('should not reinstall already installed dependencies', () => {
      const depPlugin: ConfigPlugin = {
        name: 'dep-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      const mainPlugin1: ConfigPlugin = {
        name: 'main-1',
        version: '1.0.0',
        dependencies: ['dep-plugin'],
        install: jest.fn(),
      };

      const mainPlugin2: ConfigPlugin = {
        name: 'main-2',
        version: '1.0.0',
        dependencies: ['dep-plugin'],
        install: jest.fn(),
      };

      pluginManager.register(depPlugin);
      pluginManager.use(mainPlugin1);
      pluginManager.use(mainPlugin2);

      expect(depPlugin.install).toHaveBeenCalledTimes(1);
    });

    it('should throw error when install fails', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(() => {
          throw new Error('Install failed');
        }),
      };

      expect(() => pluginManager.use(plugin)).toThrow(PluginError);
      expect(() => pluginManager.use(plugin)).toThrow('Failed to install plugin');
    });

    it('should include original error message in PluginError', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(() => {
          throw new Error('Custom error message');
        }),
      };

      try {
        pluginManager.use(plugin);
      } catch (error) {
        expect((error as PluginError).message).toContain('Custom error message');
      }
    });

    it('should handle plugin with empty dependencies array', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        dependencies: [],
        install: jest.fn(),
      };

      pluginManager.use(plugin);

      expect(plugin.install).toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should return empty array initially', () => {
      expect(pluginManager.list()).toEqual([]);
    });

    it('should list all registered plugins', () => {
      const plugin1: ConfigPlugin = {
        name: 'plugin-1',
        version: '1.0.0',
        install: jest.fn(),
      };
      const plugin2: ConfigPlugin = {
        name: 'plugin-2',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.register(plugin1);
      pluginManager.register(plugin2);

      const list = pluginManager.list();

      expect(list).toContain('plugin-1');
      expect(list).toContain('plugin-2');
      expect(list.length).toBe(2);
    });

    it('should not include unregistered plugins', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.register(plugin);
      pluginManager.unregister('test-plugin');

      expect(pluginManager.list()).not.toContain('test-plugin');
    });
  });

  describe('listInstalled', () => {
    it('should return empty array initially', () => {
      expect(pluginManager.listInstalled()).toEqual([]);
    });

    it('should list only installed plugins', () => {
      const plugin1: ConfigPlugin = {
        name: 'plugin-1',
        version: '1.0.0',
        install: jest.fn(),
      };
      const plugin2: ConfigPlugin = {
        name: 'plugin-2',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.register(plugin1);
      pluginManager.register(plugin2);
      pluginManager.use(plugin1);

      const installed = pluginManager.listInstalled();

      expect(installed).toContain('plugin-1');
      expect(installed).not.toContain('plugin-2');
    });

    it('should update after plugin is installed', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.register(plugin);
      expect(pluginManager.listInstalled()).toEqual([]);

      pluginManager.use(plugin);
      expect(pluginManager.listInstalled()).toContain('test-plugin');
    });
  });

  describe('get', () => {
    it('should return registered plugin', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.register(plugin);

      expect(pluginManager.get('test-plugin')).toBe(plugin);
    });

    it('should return undefined for non-existent plugin', () => {
      expect(pluginManager.get('nonexistent')).toBeUndefined();
    });

    it('should return plugin even if not installed', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.register(plugin);

      expect(pluginManager.get('test-plugin')).toBe(plugin);
      expect(pluginManager.isInstalled('test-plugin')).toBe(false);
    });
  });

  describe('has', () => {
    it('should return true for registered plugin', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.register(plugin);

      expect(pluginManager.has('test-plugin')).toBe(true);
    });

    it('should return false for non-existent plugin', () => {
      expect(pluginManager.has('nonexistent')).toBe(false);
    });

    it('should return false after unregister', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.register(plugin);
      pluginManager.unregister('test-plugin');

      expect(pluginManager.has('test-plugin')).toBe(false);
    });
  });

  describe('isInstalled', () => {
    it('should return true for installed plugin', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.use(plugin);

      expect(pluginManager.isInstalled('test-plugin')).toBe(true);
    });

    it('should return false for registered but not installed plugin', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.register(plugin);

      expect(pluginManager.isInstalled('test-plugin')).toBe(false);
    });

    it('should return false for non-existent plugin', () => {
      expect(pluginManager.isInstalled('nonexistent')).toBe(false);
    });
  });

  describe('getInfo', () => {
    it('should return plugin info', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        dependencies: ['dep1', 'dep2'],
        install: jest.fn(),
      };

      pluginManager.register(plugin);

      const info = pluginManager.getInfo('test-plugin');

      expect(info).toEqual({
        name: 'test-plugin',
        version: '1.0.0',
        dependencies: ['dep1', 'dep2'],
      });
    });

    it('should return undefined for non-existent plugin', () => {
      expect(pluginManager.getInfo('nonexistent')).toBeUndefined();
    });

    it('should handle plugin without dependencies', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.register(plugin);

      const info = pluginManager.getInfo('test-plugin');

      expect(info?.dependencies).toBeUndefined();
    });
  });

  describe('getDependencyTree', () => {
    it('should return empty tree initially', () => {
      expect(pluginManager.getDependencyTree()).toEqual({});
    });

    it('should return dependency tree for all plugins', () => {
      const plugin1: ConfigPlugin = {
        name: 'plugin-1',
        version: '1.0.0',
        dependencies: ['dep1'],
        install: jest.fn(),
      };
      const plugin2: ConfigPlugin = {
        name: 'plugin-2',
        version: '2.0.0',
        dependencies: [],
        install: jest.fn(),
      };

      pluginManager.register(plugin1);
      pluginManager.register(plugin2);

      const tree = pluginManager.getDependencyTree();

      expect(tree['plugin-1']).toEqual({
        name: 'plugin-1',
        version: '1.0.0',
        dependencies: ['dep1'],
      });
      expect(tree['plugin-2']).toEqual({
        name: 'plugin-2',
        version: '2.0.0',
        dependencies: [],
      });
    });

    it('should handle plugins with undefined dependencies', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.register(plugin);

      const tree = pluginManager.getDependencyTree();

      expect(tree['test-plugin']).toEqual({
        name: 'test-plugin',
        version: '1.0.0',
        dependencies: [],
      });
    });
  });

  describe('clear', () => {
    it('should clear all plugins', () => {
      const plugin1: ConfigPlugin = {
        name: 'plugin-1',
        version: '1.0.0',
        install: jest.fn(),
      };
      const plugin2: ConfigPlugin = {
        name: 'plugin-2',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.register(plugin1);
      pluginManager.use(plugin2);

      pluginManager.clear();

      expect(pluginManager.list()).toEqual([]);
      expect(pluginManager.listInstalled()).toEqual([]);
      expect(pluginManager.has('plugin-1')).toBe(false);
      expect(pluginManager.isInstalled('plugin-2')).toBe(false);
    });

    it('should handle clearing empty manager', () => {
      expect(() => pluginManager.clear()).not.toThrow();
    });

    it('should allow adding plugins after clear', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
      };

      pluginManager.register(plugin);
      pluginManager.clear();

      pluginManager.register(plugin);

      expect(pluginManager.has('test-plugin')).toBe(true);
    });
  });

  describe('Integration tests', () => {
    it('should handle complex dependency scenarios', () => {
      const installOrder: string[] = [];

      const pluginA: ConfigPlugin = {
        name: 'plugin-a',
        version: '1.0.0',
        install: jest.fn(() => installOrder.push('a')),
      };

      const pluginB: ConfigPlugin = {
        name: 'plugin-b',
        version: '1.0.0',
        dependencies: ['plugin-a'],
        install: jest.fn(() => installOrder.push('b')),
      };

      const pluginC: ConfigPlugin = {
        name: 'plugin-c',
        version: '1.0.0',
        dependencies: ['plugin-a', 'plugin-b'],
        install: jest.fn(() => installOrder.push('c')),
      };

      pluginManager.register(pluginA);
      pluginManager.register(pluginB);
      pluginManager.register(pluginC);

      pluginManager.use(pluginC);

      expect(installOrder).toEqual(['a', 'b', 'c']);
      expect(pluginA.install).toHaveBeenCalledTimes(1);
      expect(pluginB.install).toHaveBeenCalledTimes(1);
      expect(pluginC.install).toHaveBeenCalledTimes(1);
    });

    it('should handle plugin lifecycle correctly', () => {
      const plugin: ConfigPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: jest.fn(),
        onDestroy: jest.fn(),
      };

      // Register
      pluginManager.register(plugin);
      expect(pluginManager.has('test-plugin')).toBe(true);
      expect(pluginManager.isInstalled('test-plugin')).toBe(false);

      // Use
      pluginManager.use(plugin);
      expect(plugin.install).toHaveBeenCalled();
      expect(pluginManager.isInstalled('test-plugin')).toBe(true);

      // Unregister
      pluginManager.unregister('test-plugin');
      expect(pluginManager.has('test-plugin')).toBe(false);

      // Note: onDestroy is not called by unregister - it would need to be called separately
    });

    it('should handle multiple plugins with shared dependencies', () => {
      const depPlugin: ConfigPlugin = {
        name: 'shared-dep',
        version: '1.0.0',
        install: jest.fn(),
      };

      const plugin1: ConfigPlugin = {
        name: 'plugin-1',
        version: '1.0.0',
        dependencies: ['shared-dep'],
        install: jest.fn(),
      };

      const plugin2: ConfigPlugin = {
        name: 'plugin-2',
        version: '1.0.0',
        dependencies: ['shared-dep'],
        install: jest.fn(),
      };

      pluginManager.register(depPlugin);
      pluginManager.use(plugin1);
      pluginManager.use(plugin2);

      expect(depPlugin.install).toHaveBeenCalledTimes(1);
      expect(pluginManager.isInstalled('shared-dep')).toBe(true);
      expect(pluginManager.isInstalled('plugin-1')).toBe(true);
      expect(pluginManager.isInstalled('plugin-2')).toBe(true);
    });
  });
});
