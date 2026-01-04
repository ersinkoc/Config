/**
 * Tests for LRU Cache implementation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LRUCache } from '../../../src/kernel/cache.js';

describe('LRUCache', () => {
  let cache: LRUCache;

  beforeEach(() => {
    cache = new LRUCache(5, 1000); // 5 entries, 1 second TTL
  });

  describe('constructor', () => {
    it('should create cache with default values', () => {
      const defaultCache = new LRUCache();
      const stats = defaultCache.stats();
      expect(stats.maxSize).toBe(100);
      expect(stats.ttl).toBe(60000);
    });

    it('should create cache with custom values', () => {
      const stats = cache.stats();
      expect(stats.maxSize).toBe(5);
      expect(stats.ttl).toBe(1000);
    });
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should store various data types', () => {
      cache.set('string', 'hello');
      cache.set('number', 42);
      cache.set('boolean', true);
      cache.set('object', { a: 1 });
      cache.set('array', [1, 2, 3]);

      expect(cache.get('string')).toBe('hello');
      expect(cache.get('number')).toBe(42);
      expect(cache.get('boolean')).toBe(true);
      expect(cache.get('object')).toEqual({ a: 1 });
      expect(cache.get('array')).toEqual([1, 2, 3]);
    });

    it('should overwrite existing keys', () => {
      cache.set('key', 'value1');
      cache.set('key', 'value2');
      expect(cache.get('key')).toBe('value2');
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      const shortCache = new LRUCache(10, 50); // 50ms TTL
      shortCache.set('key', 'value');
      expect(shortCache.get('key')).toBe('value');

      await new Promise(resolve => setTimeout(resolve, 60));
      expect(shortCache.get('key')).toBeUndefined();
    });

    it('should not expire with TTL of 0', async () => {
      const noTtlCache = new LRUCache(10, 0);
      noTtlCache.set('key', 'value');

      // Even with wait, should not expire
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(noTtlCache.get('key')).toBe('value');
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      cache.set('key', 'value');
      expect(cache.has('key')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired keys', async () => {
      const shortCache = new LRUCache(10, 50);
      shortCache.set('key', 'value');
      expect(shortCache.has('key')).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 60));
      expect(shortCache.has('key')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete existing keys', () => {
      cache.set('key', 'value');
      expect(cache.delete('key')).toBe(true);
      expect(cache.get('key')).toBeUndefined();
    });

    it('should return false for non-existent keys', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });
  });

  describe('size', () => {
    it('should return correct size', () => {
      expect(cache.size()).toBe(0);
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
    });
  });

  describe('keys', () => {
    it('should return all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      const keys = cache.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys.length).toBe(2);
    });

    it('should return empty array when cache is empty', () => {
      expect(cache.keys()).toEqual([]);
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entry when at capacity', () => {
      // Fill cache to capacity
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');

      // Add one more - should evict key1 (oldest)
      cache.set('key6', 'value6');

      expect(cache.size()).toBe(5);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key6')).toBe('value6');
    });

    it('should evict least recently accessed entry', async () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');

      // Access key1 to make it recently used
      await new Promise(resolve => setTimeout(resolve, 5));
      cache.get('key1');

      // Add new entry - should evict key2 (least recently accessed)
      cache.set('key6', 'value6');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeUndefined();
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      const shortCache = new LRUCache(10, 50);
      shortCache.set('key1', 'value1');
      shortCache.set('key2', 'value2');

      await new Promise(resolve => setTimeout(resolve, 60));

      const cleared = shortCache.cleanup();
      expect(cleared).toBe(2);
      expect(shortCache.size()).toBe(0);
    });

    it('should return 0 when TTL is 0', () => {
      const noTtlCache = new LRUCache(10, 0);
      noTtlCache.set('key', 'value');
      expect(noTtlCache.cleanup()).toBe(0);
    });

    it('should not remove non-expired entries', () => {
      cache.set('key', 'value');
      const cleared = cache.cleanup();
      expect(cleared).toBe(0);
      expect(cache.get('key')).toBe('value');
    });
  });

  describe('configure', () => {
    it('should update maxSize', () => {
      cache.configure({ maxSize: 10 });
      expect(cache.stats().maxSize).toBe(10);
    });

    it('should update TTL', () => {
      cache.configure({ ttl: 5000 });
      expect(cache.stats().ttl).toBe(5000);
    });

    it('should evict entries when reducing maxSize', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.configure({ maxSize: 2 });
      expect(cache.size()).toBe(2);
    });
  });

  describe('stats', () => {
    it('should return correct statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.stats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(5);
      expect(stats.ttl).toBe(1000);
    });
  });
});
