//==============================================================================
// Core Types
//==============================================================================

/**
 * Merge strategy options for combining configurations.
 *
 * @example
 * ```typescript
 * {
 *   default: 'merge',
 *   arrays: 'unique',
 *   paths: {
 *     'server.plugins': 'append',
 *     'database.hosts': 'replace'
 *   }
 * }
 * ```
 */
export interface MergeStrategyOptions {
  /** Default strategy for all values */
  default?: 'replace' | 'merge';

  /** Strategy for arrays */
  arrays?: 'replace' | 'append' | 'prepend' | 'unique';

  /** Path-specific strategies */
  paths?: Record<string, MergeStrategy>;
}

/**
 * Type representing merge strategies.
 */
export type MergeStrategy = 'replace' | 'merge' | 'append' | 'prepend' | 'unique';

/**
 * Configuration change event data.
 *
 * @example
 * ```typescript
 * {
 *   path: 'database.port',
 *   file: './config.yaml',
 *   oldValue: 5432,
 *   newValue: 5433,
 *   timestamp: 1234567890
 * }
 * ```
 */
export interface ConfigChangeEvent {
  /** Path to changed value (dot notation) */
  path: string;

  /** File that changed */
  file: string;

  /** Previous value */
  oldValue: unknown;

  /** New value */
  newValue: unknown;

  /** Timestamp of change (milliseconds since epoch) */
  timestamp: number;
}

/**
 * Options for file watching.
 *
 * @example
 * ```typescript
 * {
 *   debounce: 300,
 *   persistent: true
 * }
 * ```
 */
export interface WatchOptions {
  /** Debounce delay in milliseconds (default: 300) */
  debounce?: number;

  /** Keep process running (default: true) */
  persistent?: boolean;
}

/**
 * Represents a single validation issue.
 */
export interface ValidationIssue {
  /** Path to the invalid property */
  path: string;

  /** Error message */
  message: string;

  /** Expected value or type */
  expected?: string;

  /** Actual value */
  actual?: unknown;
}

/**
 * File system watch event.
 */
export interface FileWatchEvent {
  /** Event type */
  type: 'change' | 'rename' | 'error';

  /** File path */
  path: string;

  /** Event timestamp */
  timestamp: number;

  /** Event metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Shared context type between plugins.
 */
export interface ConfigContext {
  /** Application name */
  name: string;

  /** Current environment */
  env: string;

  /** Configuration data */
  config: Record<string, unknown>;
}

//==============================================================================
// Plugin System Types
//==============================================================================

/**
 * Plugin lifecycle event handler.
 */
export interface PluginEventHandler<T = unknown> {
  (data: T): void | Promise<void>;
}

/**
 * Base plugin interface for extending config functionality.
 *
 * @typeParam TContext - Shared context type between plugins
 *
 * @example
 * ```typescript
 * const myPlugin: ConfigPlugin = {
 *   name: 'my-plugin',
 *   version: '1.0.0',
 *   install(kernel) {
 *     // Plugin setup
 *   }
 * };
 * ```
 */
export interface ConfigPlugin<TContext = ConfigContext> {
  /** Unique plugin identifier (kebab-case) */
  name: string;

  /** Semantic version (e.g., "1.0.0") */
  version: string;

  /** Other plugins this plugin depends on */
  dependencies?: string[];

  /**
   * Called when plugin is registered.
   * @param kernel - The config kernel instance
   */
  install: (kernel: ConfigKernel<TContext>) => void;

  /**
   * Called before config is loaded.
   * Can modify load options.
   * @param options - Load options
   * @returns Modified load options
   */
  onBeforeLoad?: (options: LoadOptions) => LoadOptions | Promise<LoadOptions>;

  /**
   * Called after config is loaded but before merge.
   * Can transform parsed data.
   * @param data - Parsed configuration data
   * @param format - Configuration format
   * @returns Transformed data
   */
  onAfterParse?: (data: unknown, format: string) => unknown | Promise<unknown>;

  /**
   * Called after all configs are merged.
   * Can validate or transform final config.
   * @param config - Merged configuration
   * @returns Transformed configuration
   */
  onAfterMerge?: (config: unknown) => unknown | Promise<unknown>;

  /**
   * Called when config value is accessed.
   * Can transform retrieved values.
   * @param path - Configuration path
   * @param value - Retrieved value
   * @returns Transformed value
   */
  onGet?: (path: string, value: unknown) => unknown;

  /**
   * Called when config value is set.
   * Can validate or transform values.
   * @param path - Configuration path
   * @param value - Value to set
   * @returns Transformed value
   */
  onSet?: (path: string, value: unknown) => unknown;

  /**
   * Called when config file changes (watch mode).
   * @param event - Change event
   */
  onChange?: (event: ConfigChangeEvent) => void | Promise<void>;

  /**
   * Called when plugin is unregistered.
   */
  onDestroy?: () => void | Promise<void>;

  /**
   * Called on error in this plugin.
   * @param error - The error that occurred
   */
  onError?: (error: Error) => void;
}

//==============================================================================
// Parser Types
//==============================================================================

/**
 * Configuration format parser interface.
 */
export interface ConfigParser {
  /** Parse configuration string into object */
  parse(content: string, file: string): unknown;

  /** Serialize object to configuration string */
  stringify(data: unknown): string;

  /** File extensions this parser handles */
  extensions: string[];

  /** Priority (higher numbers checked first) */
  priority: number;

  /** Format name */
  format: string;
}

/**
 * Parser registration options.
 */
export interface ParserRegistration {
  /** Parser instance */
  parser: ConfigParser;

  /** Registration timestamp */
  registeredAt: number;
}

//==============================================================================
// Configuration API Types
//==============================================================================

/**
 * Configuration loader options.
 *
 * @example
 * ```typescript
 * {
 *   name: 'myapp',
 *   paths: ['./config.yaml', './config.local.yaml'],
 *   env: 'development',
 *   envPrefix: 'MYAPP_',
 *   defaults: { port: 3000 },
 *   required: ['database.host']
 * }
 * ```
 */
export interface LoadOptions {
  /** Application name (used for env prefix, file naming) */
  name: string;

  /** Paths to config files (resolved relative to cwd) */
  paths?: string[];

  /** Base directory for config files (default: process.cwd()) */
  cwd?: string;

  /** Current environment (default: process.env.NODE_ENV || 'development') */
  env?: string;

  /** Supported environments for override files */
  environments?: string[];

  /** Environment variable prefix for overrides (default: name.toUpperCase() + '_') */
  envPrefix?: string;

  /** Default values */
  defaults?: Record<string, unknown>;

  /** Required field paths */
  required?: string[];

  /** Merge strategy configuration */
  mergeStrategy?: MergeStrategyOptions;

  /** Enable file watching */
  watch?: boolean;

  /** Watch mode options */
  watchOptions?: WatchOptions;

  /** Plugins to use */
  plugins?: ConfigPlugin[];
}

/**
 * Configuration instance interface.
 *
 * @typeParam T - Configuration data type
 *
 * @example
 * ```typescript
 * interface AppConfig {
 *   port: number;
 *   database: { host: string; port: number };
 * }
 *
 * const config = await loadConfig<AppConfig>({ name: 'myapp' });
 * const port = config.get('port');
 * const dbHost = config.get('database.host');
 * ```
 */
export interface Config<T = unknown> {
  /** Get value at path */
  get<K extends keyof T>(key: K): T[K];
  get<V = unknown>(path: string): V;
  get<V = unknown>(path: string, defaultValue: V): V;

  /** Set value at path */
  set(path: string, value: unknown): void;

  /** Check if path exists */
  has(path: string): boolean;

  /** Delete value at path */
  delete(path: string): boolean;

  /** Get all config as object */
  toObject(): T;

  /** Get all config as JSON string */
  toJSON(): string;

  /** Reload configuration from files */
  reload(): Promise<void>;

  /** Register event listener */
  on<E extends ConfigEvent>(event: E, handler: EventHandler<E>): void;

  /** Remove event listener */
  off<E extends ConfigEvent>(event: E, handler: EventHandler<E>): void;

  /** Start watching files */
  watch(): void;

  /** Stop watching files */
  unwatch(): void;

  /** Register plugin */
  use(plugin: ConfigPlugin): void;

  /** List registered plugins */
  plugins(): string[];
}

//==============================================================================
// Event System Types
//==============================================================================

/**
 * Configuration event types.
 */
export type ConfigEvent = 'change' | 'reload' | 'error' | 'watch:start' | 'watch:stop';

/**
 * Event handler function type.
 *
 * @typeParam T - Event data type
 */
export type EventHandler<T = unknown> = (event: T) => void | Promise<void>;

//==============================================================================
// Kernel Types
//==============================================================================

/**
 * Config kernel context.
 */
export interface KernelContext {
  /** Application name */
  name: string;

  /** Current environment */
  env: string;

  /** Configuration data */
  config: Record<string, unknown>;
}

/**
 * File watcher interface.
 */
export interface FileWatcher {
  /** Watch a file for changes */
  watch(path: string, callback: (event: FileWatchEvent) => void): void;

  /** Stop watching a file */
  unwatch(path: string): void;

  /** Clean up all watchers */
  close(): void;
}

/**
 * Cache interface.
 */
export interface Cache {
  /** Get value from cache */
  get(key: string): unknown;

  /** Set value in cache */
  set(key: string, value: unknown): void;

  /** Delete value from cache */
  delete(key: string): boolean;

  /** Check if key exists */
  has(key: string): boolean;

  /** Clear all cache entries */
  clear(): void;
}

/**
 * Event bus interface.
 */
export interface EventBus {
  /** Subscribe to event */
  on(event: string, handler: PluginEventHandler): void;

  /** Unsubscribe from event */
  off(event: string, handler: PluginEventHandler): void;

  /** Emit event */
  emit(event: string, data?: unknown): void;

  /** Subscribe to event once */
  once(event: string, handler: PluginEventHandler): void;

  /** Remove all listeners */
  removeAllListeners(event?: string): void;
}

/**
 * Plugin manager interface.
 */
export interface PluginManager {
  /** Register a plugin */
  register(plugin: ConfigPlugin): void;

  /** Unregister a plugin */
  unregister(name: string): void;

  /** Install a plugin */
  use(plugin: ConfigPlugin): void;

  /** List registered plugins */
  list(): string[];

  /** Get plugin by name */
  get(name: string): ConfigPlugin | undefined;
}

/**
 * Config kernel interface.
 */
export interface ConfigKernel<TContext = KernelContext> {
  /** Plugin registry */
  plugins: PluginManager;

  /** Event bus */
  events: EventBus;

  /** Cache */
  cache: Cache;

  /** File system */
  fs: FileSystem;

  /** Context */
  context: TContext;

  /** Get plugin by name */
  getPlugin(name: string): ConfigPlugin | undefined;

  /** Emit event */
  emit(event: string, data?: unknown): void;

  /** Subscribe to event */
  on(event: string, handler: PluginEventHandler): void;

  /** Unsubscribe from event */
  off(event: string, handler: PluginEventHandler): void;
}

/**
 * File system interface.
 */
export interface FileSystem {
  /** Read file content */
  readFile(path: string): Promise<string>;

  /** Check if file exists */
  exists(path: string): Promise<boolean>;

  /** Watch file */
  watchFile(path: string, callback: (event: FileWatchEvent) => void): void;

  /** Unwatch file */
  unwatchFile(path: string): void;
}
