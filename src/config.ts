/**
 * Config class - main interface for configuration management.
 */

import { get, set, has, deletePath, deepClone } from './utils/path.js';
import { mergeConfigs } from './utils/deep-merge.js';
import { findConfigFiles, detectFormat } from './utils/file.js';
import { parserRegistry } from './parsers/index.js';
import { createKernel } from './kernel.js';
import { ConfigNotFoundError, RequiredFieldError } from './errors.js';
import type { Config, LoadOptions, ConfigEvent, EventHandler, ConfigChangeEvent } from './types.js';
import type { ConfigKernel } from './kernel.js';

/**
 * Configuration instance implementation.
 */
export class ConfigImpl<T = unknown> implements Config<T> {
  private data: Record<string, unknown> = {};
  private eventHandlers = new Map<ConfigEvent, Set<EventHandler>>();
  private configFiles: string[] = [];
  private isWatching = false;
  private kernel: ConfigKernel;
  private options: LoadOptions;

  constructor(options: LoadOptions) {
    this.options = options;
    this.kernel = createKernel({
      name: options.name,
      env: options.env || 'development',
      config: this.data,
    });
  }

  /**
   * Gets a value at the given path.
   *
   * @typeParam K - Key of the configuration object
   * @param key - Key to get
   * @returns Value at key
   *
   * @example
   * ```typescript
   * const port = config.get('port');
   * const dbHost = config.get('database.host');
   * ```
   */
  get<K extends keyof T>(key: K): T[K];
  /**
   * Gets a value at the given path.
   *
   * @param path - Dot-notation path
   * @returns Value at path
   */
  get<V = unknown>(path: string): V;
  /**
   * Gets a value at the given path with default.
   *
   * @param path - Dot-notation path
   * @param defaultValue - Default value if not found
   * @returns Value at path or default
   */
  get<V = unknown>(path: string, defaultValue: V): V;
  get(pathOrKey: string, defaultValue?: unknown): unknown {
    // Apply plugin hooks
    let value = get(this.data, pathOrKey, defaultValue);

    // Call onGet hooks from plugins
    for (const plugin of this.kernel.plugins.listInstalled()) {
      const pluginInstance = this.kernel.getPlugin(plugin);
      if (pluginInstance?.onGet) {
        try {
          value = pluginInstance.onGet(pathOrKey, value);
        } catch (error) {
          console.error(`Error in plugin ${plugin} onGet hook:`, error);
        }
      }
    }

    return value;
  }

  /**
   * Sets a value at the given path.
   *
   * @param path - Dot-notation path
   * @param value - Value to set
   *
   * @example
   * ```typescript
   * config.set('port', 3000);
   * config.set('database.host', 'localhost');
   * ```
   */
  set(path: string, value: unknown): void {
    // Apply plugin hooks
    let processedValue = value;

    // Call onSet hooks from plugins
    for (const plugin of this.kernel.plugins.listInstalled()) {
      const pluginInstance = this.kernel.getPlugin(plugin);
      if (pluginInstance?.onSet) {
        try {
          processedValue = pluginInstance.onSet(path, processedValue);
        } catch (error) {
          console.error(`Error in plugin ${plugin} onSet hook:`, error);
        }
      }
    }

    set(this.data, path, processedValue);
  }

  /**
   * Checks if a path exists in the configuration.
   *
   * @param path - Dot-notation path
   * @returns True if path exists
   *
   * @example
   * ```typescript
   * if (config.has('database.host')) {
   *   // Database host is configured
   * }
   * ```
   */
  has(path: string): boolean {
    return has(this.data, path);
  }

  /**
   * Deletes a value at the given path.
   *
   * @param path - Dot-notation path
   * @returns True if value was deleted
   *
   * @example
   * ```typescript
   * config.delete('temp_setting');
   * ```
   */
  delete(path: string): boolean {
    return deletePath(this.data, path);
  }

  /**
   * Gets the entire configuration as an object.
   *
   * @returns Configuration object
   *
   * @example
   * ```typescript
   * const allConfig = config.toObject();
   * ```
   */
  toObject(): T {
    return deepClone(this.data) as T;
  }

  /**
   * Gets the entire configuration as a JSON string.
   *
   * @returns JSON string
   *
   * @example
   * ```typescript
   * const json = config.toJSON();
   * ```
   */
  toJSON(): string {
    return JSON.stringify(this.data, null, 2);
  }

  /**
   * Reloads the configuration from files.
   *
   * @example
   * ```typescript
   * await config.reload();
   * ```
   */
  async reload(): Promise<void> {
    const oldData = deepClone(this.data);
    await this.load();
    this.emit('reload', { oldData, newData: this.data });
  }

  /**
   * Registers an event listener.
   *
   * @typeParam E - Event type
   * @param event - Event name
   * @param handler - Event handler
   *
   * @example
   * ```typescript
   * config.on('change', (event) => {
   *   console.log('Config changed:', event.path);
   * });
   * ```
   */
  on<E extends ConfigEvent>(event: E, handler: EventHandler<E>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler as EventHandler);
  }

  /**
   * Removes an event listener.
   *
   * @typeParam E - Event type
   * @param event - Event name
   * @param handler - Event handler
   *
   * @example
   * ```typescript
   * config.off('change', handler);
   * ```
   */
  off<E extends ConfigEvent>(event: E, handler: EventHandler<E>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  /**
   * Starts watching configuration files for changes.
   *
   * @example
   * ```typescript
   * config.watch();
   * ```
   */
  watch(): void {
    if (this.isWatching) {
      return;
    }

    this.isWatching = true;
    this.emit('watch:start', undefined);

    // Setup file watching
    for (const file of this.configFiles) {
      this.kernel.fs.watchFile(file, (event) => {
        this.handleFileChange(event);
      });
    }
  }

  /**
   * Stops watching configuration files.
   *
   * @example
   * ```typescript
   * config.unwatch();
   * ```
   */
  unwatch(): void {
    if (!this.isWatching) {
      return;
    }

    this.isWatching = false;
    this.emit('watch:stop', undefined);

    // Close all watchers
    this.kernel.fs.close();
  }

  /**
   * Registers a plugin.
   *
   * @param plugin - Plugin to register
   *
   * @example
   * ```typescript
   * config.use(myPlugin);
   * ```
   */
  use(plugin: import('./types.js').ConfigPlugin): void {
    this.kernel.plugins.use(plugin);
  }

  /**
   * Lists all registered plugins.
   *
   * @returns Array of plugin names
   *
   * @example
   * ```typescript
   * const plugins = config.plugins();
   * ```
   */
  plugins(): string[] {
    return this.kernel.plugins.listInstalled();
  }

  /**
   * Gets the underlying kernel instance.
   *
   * @returns Config kernel
   */
  getKernel(): ConfigKernel {
    return this.kernel;
  }

  /**
   * Loads the configuration.
   *
   * @param options - Load options
   * @returns Loaded configuration
   */
  async load(): Promise<void> {
    const cwd = this.options.cwd || process.cwd();
    const env = this.options.env || process.env.NODE_ENV || 'development';
    const envs = this.options.environments || ['development', 'staging', 'production'];

    // Find config files
    this.configFiles = findConfigFiles(this.options.name, cwd, env);

    if (this.configFiles.length === 0 && (!this.options.paths || this.options.paths.length === 0)) {
      throw new ConfigNotFoundError(
        `No configuration files found for '${this.options.name}' in ${cwd}`
      );
    }

    // Add explicit paths if provided
    if (this.options.paths) {
      for (const path of this.options.paths) {
        this.configFiles.push(path);
      }
    }

    // Load and parse each config file
    const configs: Record<string, unknown>[] = [];

    for (const file of this.configFiles) {
      try {
        const content = await this.kernel.fs.readFile(file);
        const format = detectFormat(file);

        // Get parser
        const parser = parserRegistry.detect(file);
        if (!parser) {
          console.warn(`No parser found for file: ${file}`);
          continue;
        }

        // Parse content
        const data = parser.parse(content, file);
        configs.push(data as Record<string, unknown>);
      } catch (error) {
        if (error instanceof ConfigNotFoundError) {
          continue; // Skip missing files
        }
        console.error(`Error loading config from ${file}:`, error);
      }
    }

    // Apply defaults
    if (this.options.defaults) {
      configs.unshift(this.options.defaults);
    }

    // Merge all configs
    this.data = mergeConfigs(configs, this.options.mergeStrategy);

    // Validate required fields
    if (this.options.required && this.options.required.length > 0) {
      this.validateRequired(this.options.required);
    }

    // Call onAfterMerge hooks from plugins
    for (const pluginName of this.kernel.plugins.listInstalled()) {
      const plugin = this.kernel.getPlugin(pluginName);
      if (plugin?.onAfterMerge) {
        try {
          this.data = (await plugin.onAfterMerge(this.data)) as Record<string, unknown>;
        } catch (error) {
          console.error(`Error in plugin ${pluginName} onAfterMerge hook:`, error);
        }
      }
    }
  }

  /**
   * Validates required fields.
   *
   * @param required - Array of required field paths
   */
  private validateRequired(required: string[]): void {
    for (const field of required) {
      if (!has(this.data, field)) {
        throw new RequiredFieldError(field);
      }
    }
  }

  /**
   * Handles file change events.
   *
   * @param event - File watch event
   */
  private async handleFileChange(event: import('./types.js').FileWatchEvent): Promise<void> {
    try {
      const oldData = deepClone(this.data);
      await this.reload();
      const newData = this.data;

      this.emit('change', {
        path: '', // TODO: Calculate specific path that changed
        file: event.path,
        oldValue: oldData,
        newValue: newData,
        timestamp: event.timestamp,
      } as ConfigChangeEvent);
    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * Emits an event.
   *
   * @typeParam E - Event type
   * @param event - Event name
   * @param data - Event data
   */
  private emit<E extends ConfigEvent>(event: E, data: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for '${event}':`, error);
        }
      }
    }
  }
}

// Export factory function
export function createConfigInstance<T>(options: LoadOptions): ConfigImpl<T> {
  return new ConfigImpl<T>(options);
}
