/**
 * Plugin manager for handling plugin lifecycle and dependencies.
 */

import type { ConfigKernel, ConfigPlugin } from '../types.js';
import { PluginError } from '../errors.js';

/**
 * Plugin manager implementation.
 */
export class PluginManager implements PluginManager {
  private plugins = new Map<string, ConfigPlugin>();
  private installed = new Set<string>();
  private kernel: ConfigKernel;

  constructor(kernel: ConfigKernel) {
    this.kernel = kernel;
  }

  /**
   * Registers a plugin without installing it.
   *
   * @param plugin - Plugin to register
   *
   * @example
   * ```typescript
   * pluginManager.register(myPlugin);
   * ```
   */
  register(plugin: ConfigPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new PluginError(`Plugin '${plugin.name}' is already registered`, plugin.name);
    }
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Unregisters a plugin.
   *
   * @param name - Plugin name
   *
   * @example
   * ```typescript
   * pluginManager.unregister('my-plugin');
   * ```
   */
  unregister(name: string): void {
    this.plugins.delete(name);
    this.installed.delete(name);
  }

  /**
   * Installs a plugin and its dependencies.
   *
   * @param plugin - Plugin to install
   *
   * @example
   * ```typescript
   * pluginManager.use(myPlugin);
   * ```
   */
  use(plugin: ConfigPlugin): void {
    // Register plugin if not already registered
    if (!this.plugins.has(plugin.name)) {
      this.register(plugin);
    }

    // Check if already installed
    if (this.installed.has(plugin.name)) {
      return;
    }

    // Install dependencies first
    if (plugin.dependencies && plugin.dependencies.length > 0) {
      for (const depName of plugin.dependencies) {
        const dep = this.plugins.get(depName);
        if (!dep) {
          throw new PluginError(`Missing dependency '${depName}' for plugin '${plugin.name}'`, plugin.name);
        }
        if (!this.installed.has(depName)) {
          this.use(dep);
        }
      }
    }

    try {
      // Call plugin install method
      plugin.install(this.kernel);
      this.installed.add(plugin.name);
    } catch (error: any) {
      throw new PluginError(
        `Failed to install plugin '${plugin.name}': ${error.message}`,
        plugin.name
      );
    }
  }

  /**
   * Lists all registered plugins.
   *
   * @returns Array of plugin names
   *
   * @example
   * ```typescript
   * const plugins = pluginManager.list();
   * ```
   */
  list(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Lists all installed plugins.
   *
   * @returns Array of installed plugin names
   *
   * @example
   * ```typescript
   * const installed = pluginManager.listInstalled();
   * ```
   */
  listInstalled(): string[] {
    return Array.from(this.installed);
  }

  /**
   * Gets a plugin by name.
   *
   * @param name - Plugin name
   * @returns Plugin or undefined if not found
   *
   * @example
   * ```typescript
   * const plugin = pluginManager.get('my-plugin');
   * ```
   */
  get(name: string): ConfigPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Checks if a plugin is registered.
   *
   * @param name - Plugin name
   * @returns True if plugin is registered
   *
   * @example
   * ```typescript
   * const isRegistered = pluginManager.has('my-plugin');
   * ```
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Checks if a plugin is installed.
   *
   * @param name - Plugin name
   * @returns True if plugin is installed
   *
   * @example
   * ```typescript
   * const isInstalled = pluginManager.isInstalled('my-plugin');
   * ```
   */
  isInstalled(name: string): boolean {
    return this.installed.has(name);
  }

  /**
   * Gets plugin information.
   *
   * @param name - Plugin name
   * @returns Plugin info or undefined
   *
   * @example
   * ```typescript
   * const info = pluginManager.getInfo('my-plugin');
   * ```
   */
  getInfo(name: string): { name: string; version: string; dependencies?: string[] } | undefined {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      return undefined;
    }

    return {
      name: plugin.name,
      version: plugin.version,
      dependencies: plugin.dependencies,
    };
  }

  /**
   * Gets all plugins with their dependency tree.
   *
   * @returns Dependency tree
   */
  getDependencyTree(): Record<string, { name: string; version: string; dependencies: string[] }> {
    const tree: Record<string, { name: string; version: string; dependencies: string[] }> = {};

    for (const [name, plugin] of this.plugins.entries()) {
      tree[name] = {
        name: plugin.name,
        version: plugin.version,
        dependencies: plugin.dependencies || [],
      };
    }

    return tree;
  }

  /**
   * Clears all plugins.
   *
   * @example
   * ```typescript
   * pluginManager.clear();
   * ```
   */
  clear(): void {
    this.plugins.clear();
    this.installed.clear();
  }
}

// Export default instance
export default PluginManager;
