/**
 * Micro-kernel core for the config system.
 * Manages plugins, events, cache, and file system operations.
 */

import { EventBus } from './kernel/events.js';
import { LRUCache } from './kernel/cache.js';
import { ConfigFileWatcher } from './kernel/watcher.js';
import { PluginManager } from './kernel/plugins.js';
import { readFile, exists } from './utils/file.js';
import type {
  ConfigKernel,
  KernelContext,
  PluginEventHandler,
  FileWatchEvent,
  FileSystem,
} from './types.js';
import type { ConfigPlugin } from './types.js';

/**
 * Config kernel implementation.
 */
export class ConfigKernelImpl implements ConfigKernel {
  public readonly plugins: PluginManager;
  public readonly events: EventBus;
  public readonly cache: LRUCache;
  public readonly fs: FileSystem;
  public context: KernelContext;

  constructor(context: KernelContext) {
    this.context = context;
    this.plugins = new PluginManager(this);
    this.events = new EventBus();
    this.cache = new LRUCache(100, 60000); // 100 entries, 60s TTL
    this.fs = new FileSystemImpl();
  }

  /**
   * Gets a plugin by name.
   *
   * @param name - Plugin name
   * @returns Plugin or undefined
   */
  getPlugin(name: string): ConfigPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Emits an event.
   *
   * @param event - Event name
   * @param data - Event data
   */
  emit(event: string, data?: unknown): void {
    this.events.emit(event, data);
  }

  /**
   * Subscribes to an event.
   *
   * @param event - Event name
   * @param handler - Event handler
   */
  on(event: string, handler: PluginEventHandler): void {
    this.events.on(event, handler);
  }

  /**
   * Unsubscribes from an event.
   *
   * @param event - Event name
   * @param handler - Event handler
   */
  off(event: string, handler: PluginEventHandler): void {
    this.events.off(event, handler);
  }

  /**
   * Initializes the kernel with default plugins.
   */
  initialize(): void {
    // Emit initialization event
    this.emit('kernel:initialized');
  }

  /**
   * Shuts down the kernel and cleans up resources.
   */
  shutdown(): void {
    this.emit('kernel:shutdown');
    this.cache.clear();
    this.plugins.clear();
    this.events.removeAllListeners();
  }
}

/**
 * File system abstraction.
 */
class FileSystemImpl {
  private watcher = new ConfigFileWatcher();

  /**
   * Reads a file.
   *
   * @param path - File path
   * @returns File content
   */
  async readFile(path: string): Promise<string> {
    return readFile(path);
  }

  /**
   * Checks if a file exists.
   *
   * @param path - File path
   * @returns True if file exists
   */
  async exists(path: string): Promise<boolean> {
    return exists(path);
  }

  /**
   * Watches a file.
   *
   * @param path - File path
   * @param callback - Change callback
   */
  watchFile(path: string, callback: (event: FileWatchEvent) => void): void {
    this.watcher.watch(path, callback);
  }

  /**
   * Unwatches a file.
   *
   * @param path - File path
   */
  unwatchFile(path: string): void {
    this.watcher.unwatch(path);
  }

  /**
   * Closes all watchers.
   */
  close(): void {
    this.watcher.close();
  }
}

// Export default kernel factory
export function createKernel(context: KernelContext): ConfigKernel {
  return new ConfigKernelImpl(context);
}

// Re-export ConfigKernel type
export type { ConfigKernel } from './types.js';
