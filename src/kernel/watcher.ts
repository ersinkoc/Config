/**
 * File watcher implementation using native Node.js fs.watch.
 */

import { watch as fsWatch, unwatchFile as fsUnwatchFile } from 'node:fs';
import type { FileWatcher, FileWatchEvent } from '../types.js';

/**
 * File watcher implementation.
 */
export class ConfigFileWatcher implements FileWatcher {
  private watchers = new Map<string, ReturnType<typeof fsWatch>>();
  private callbacks = new Map<string, (event: FileWatchEvent) => void>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Watches a file for changes.
   *
   * @param filePath - Path to file
   * @param callback - Callback function for changes
   *
   * @example
   * ```typescript
   * watcher.watch('./config.yaml', (event) => {
   *   console.log('File changed:', event);
   * });
   * ```
   */
  watch(filePath: string, callback: (event: FileWatchEvent) => void): void {
    // Remove existing watcher if any
    this.unwatch(filePath);

    try {
      const watcher = fsWatch(filePath, (eventType, filename) => {
        this.handleFileChange(filePath, eventType, callback);
      });

      this.watchers.set(filePath, watcher);
      this.callbacks.set(filePath, callback);
    } catch (error) {
      console.error(`Failed to watch file ${filePath}:`, error);
    }
  }

  /**
   * Stops watching a file.
   *
   * @param filePath - Path to file
   *
   * @example
   * ```typescript
   * watcher.unwatch('./config.yaml');
   * ```
   */
  unwatch(filePath: string): void {
    const watcher = this.watchers.get(filePath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(filePath);
    }

    this.callbacks.delete(filePath);

    const timer = this.debounceTimers.get(filePath);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(filePath);
    }
  }

  /**
   * Cleans up all watchers.
   *
   * @example
   * ```typescript
   * watcher.close();
   * ```
   */
  close(): void {
    for (const filePath of this.watchers.keys()) {
      this.unwatch(filePath);
    }
  }

  /**
   * Gets the list of watched files.
   *
   * @returns Array of watched file paths
   */
  getWatchedFiles(): string[] {
    return Array.from(this.watchers.keys());
  }

  /**
   * Handles file change events with debouncing.
   */
  private handleFileChange(
    filePath: string,
    eventType: string,
    callback: (event: FileWatchEvent) => void
  ): void {
    // Clear existing debounce timer
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounce timer (300ms default)
    const timer = setTimeout(() => {
      const event: FileWatchEvent = {
        type: this.mapEventType(eventType),
        path: filePath,
        timestamp: Date.now(),
        metadata: {
          originalEvent: eventType,
        },
      };

      try {
        callback(event);
      } catch (error) {
        console.error('Error in file watch callback:', error);
      }
    }, 300);

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * Maps Node.js event types to our event types.
   */
  private mapEventType(eventType: string | null): 'change' | 'rename' | 'error' {
    if (eventType === 'change') {
      return 'change';
    }
    return 'rename';
  }
}

// Export default instance
export default ConfigFileWatcher;
