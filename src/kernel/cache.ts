/**
 * LRU Cache implementation with TTL support.
 */

import type { Cache } from '../types.js';

/**
 * Cache entry with metadata.
 */
interface CacheEntry {
  value: unknown;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * LRU Cache with TTL support.
 */
export class LRUCache implements Cache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = 100, ttl = 60000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Gets a value from cache.
   *
   * @param key - Cache key
   * @returns Cached value or undefined
   *
   * @example
   * ```typescript
   * const value = cache.get('my-key');
   * ```
   */
  get(key: string): unknown {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (this.ttl > 0 && Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.value;
  }

  /**
   * Sets a value in cache.
   *
   * @param key - Cache key
   * @param value - Value to cache
   *
   * @example
   * ```typescript
   * cache.set('my-key', 'my-value');
   * ```
   */
  set(key: string, value: unknown): void {
    // Only evict if at capacity and adding a new key
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    // Get current entry to preserve access time if updating
    const currentEntry = this.cache.get(key);

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: currentEntry?.accessCount || 0,
      lastAccessed: Date.now(),
    });
  }

  /**
   * Deletes a value from cache.
   *
   * @param key - Cache key
   * @returns True if value was deleted
   *
   * @example
   * ```typescript
   * const deleted = cache.delete('my-key');
   * ```
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Checks if a key exists in cache.
   *
   * @param key - Cache key
   * @returns True if key exists and is not expired
   *
   * @example
   * ```typescript
   * const exists = cache.has('my-key');
   * ```
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (this.ttl > 0 && Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clears all cache entries.
   *
   * @example
   * ```typescript
   * cache.clear();
   * ```
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets cache size.
   *
   * @returns Number of entries in cache
   *
   * @example
   * ```typescript
   * const size = cache.size();
   * ```
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Gets all keys in cache.
   *
   * @returns Array of keys
   *
   * @example
   * ```typescript
   * const keys = cache.keys();
   * ```
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Clears expired entries.
   *
   * @returns Number of entries cleared
   *
   * @example
   * ```typescript
   * const cleared = cache.cleanup();
   * ```
   */
  cleanup(): number {
    if (this.ttl === 0) {
      return 0;
    }

    let cleared = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Updates cache configuration.
   *
   * @param options - Configuration options
   *
   * @example
   * ```typescript
   * cache.configure({ maxSize: 200, ttl: 120000 });
   * ```
   */
  configure(options: { maxSize?: number; ttl?: number }): void {
    if (options.maxSize !== undefined) {
      this.maxSize = options.maxSize;
      // Evict if necessary
      while (this.cache.size > this.maxSize) {
        this.evictOldest();
      }
    }

    if (options.ttl !== undefined) {
      this.ttl = options.ttl;
    }
  }

  /**
   * Gets cache statistics.
   *
   * @returns Cache statistics
   *
   * @example
   * ```typescript
   * const stats = cache.stats();
   * ```
   */
  stats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
    };
  }

  /**
   * Evicts the oldest accessed entry.
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// Export default instance
export default LRUCache;
