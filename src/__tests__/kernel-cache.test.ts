// @ts-nocheck
/**
 * Tests for kernel/cache.ts
 */

import { LRUCache } from '../kernel/cache.js';

describe('LRUCache', () => {
  let cache: LRUCache;

  beforeEach(() => {
    cache = new LRUCache();
  });

  describe('constructor', () => {
    it('should create cache with default size and TTL', () => {
      const defaultCache = new LRUCache();
      expect(defaultCache.size()).toBe(0);
    });

    it('should create cache with custom size', () => {
      const customCache = new LRUCache(50);
      expect(customCache.size()).toBe(0);
    });

    it('should create cache with custom TTL', () => {
      const customCache = new LRUCache(100, 30000);
      expect(customCache.size()).toBe(0);
    });

    it('should create cache with zero TTL (no expiration)', () => {
      const noExpiryCache = new LRUCache(100, 0);
      noExpiryCache.set('key', 'value');
      expect(noExpiryCache.has('key')).toBe(true);
    });
  });

  describe('set', () => {
    it('should set a value', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should update existing value', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
    });

    it('should store different types', () => {
      cache.set('string', 'value');
      cache.set('number', 42);
      cache.set('boolean', true);
      cache.set('null', null);
      cache.set('object', { a: 1 });
      cache.set('array', [1, 2, 3]);

      expect(cache.get('string')).toBe('value');
      expect(cache.get('number')).toBe(42);
      expect(cache.get('boolean')).toBe(true);
      expect(cache.get('null')).toBeNull();
      expect(cache.get('object')).toEqual({ a: 1 });
      expect(cache.get('array')).toEqual([1, 2, 3]);
    });

    it('should evict oldest entry when at capacity', () => {
      const smallCache = new LRUCache(3);
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');

      expect(smallCache.size()).toBe(3);

      // This should evict key1 (least recently accessed)
      smallCache.set('key4', 'value4');

      expect(smallCache.size()).toBe(3);
      expect(smallCache.get('key1')).toBeUndefined();
      expect(smallCache.get('key2')).toBe('value2');
      expect(smallCache.get('key3')).toBe('value3');
      expect(smallCache.get('key4')).toBe('value4');
    });

    it('should not evict when updating existing key', () => {
      const smallCache = new LRUCache(2);
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');

      // Update key1 - should not trigger eviction
      smallCache.set('key1', 'updated');

      expect(smallCache.size()).toBe(2);
      expect(smallCache.get('key1')).toBe('updated');
      expect(smallCache.get('key2')).toBe('value2');
    });

    it('should update access time on set', async () => {
      const smallCache = new LRUCache(3);
      smallCache.set('key1', 'value1');
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 2));
      smallCache.set('key2', 'value2');
      await new Promise(resolve => setTimeout(resolve, 2));
      smallCache.set('key3', 'value3');

      // Access key1 to make it more recent than key2 and key3
      smallCache.get('key1');

      // Add new entry - should evict key2 (oldest, since key1 was just accessed)
      smallCache.set('key4', 'value4');

      expect(smallCache.get('key1')).toBe('value1');
      expect(smallCache.get('key2')).toBeUndefined();
      expect(smallCache.get('key3')).toBe('value3');
      expect(smallCache.get('key4')).toBe('value4');
      expect(smallCache.size()).toBe(3);
    });

  });

  describe('get', () => {
    it('should return value for existing key', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent key', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should return undefined and delete expired entry', () => {
      const shortTTLCache = new LRUCache(100, 10);
      shortTTLCache.set('key1', 'value1');

      // Wait for expiration
      const waitForExpiration = new Promise((resolve) => setTimeout(resolve, 15));

      return waitForExpiration.then(() => {
        expect(shortTTLCache.get('key1')).toBeUndefined();
        expect(shortTTLCache.size()).toBe(0);
      });
    });

    it('should update access time on get', async () => {
      const smallCache = new LRUCache(3);
      smallCache.set('key1', 'value1');
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 2));
      smallCache.set('key2', 'value2');
      await new Promise(resolve => setTimeout(resolve, 2));
      smallCache.set('key3', 'value3');

      // Access key1 to make it more recent than key2 and key3
      smallCache.get('key1');

      // Add new entry - should evict key2 (oldest, since key1 was just accessed)
      smallCache.set('key4', 'value4');

      expect(smallCache.get('key1')).toBe('value1');
      expect(smallCache.get('key2')).toBeUndefined();
      expect(smallCache.get('key3')).toBe('value3');
      expect(smallCache.get('key4')).toBe('value4');
      expect(smallCache.size()).toBe(3);
    });

    it('should handle undefined values', () => {
      cache.set('key1', undefined);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should handle null values', () => {
      cache.set('key1', null);
      expect(cache.get('key1')).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete existing key', () => {
      cache.set('key1', 'value1');
      const result = cache.delete('key1');

      expect(result).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.has('key1')).toBe(false);
    });

    it('should return false for non-existent key', () => {
      const result = cache.delete('nonexistent');
      expect(result).toBe(false);
    });

    it('should reduce size when deleting', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      expect(cache.size()).toBe(2);

      cache.delete('key1');

      expect(cache.size()).toBe(1);
    });

    it('should handle deleting from empty cache', () => {
      expect(cache.delete('any')).toBe(false);
      expect(cache.size()).toBe(0);
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired entries', () => {
      const shortTTLCache = new LRUCache(100, 10);
      shortTTLCache.set('key1', 'value1');

      // Wait for expiration
      const waitForExpiration = new Promise((resolve) => setTimeout(resolve, 15));

      return waitForExpiration.then(() => {
        expect(shortTTLCache.has('key1')).toBe(false);
      });
    });

    it('should not update access time', () => {
      const smallCache = new LRUCache(3);
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');

      // has should not update access time
      smallCache.has('key1');

      // Add new entry - should evict key1 (oldest accessed since has() doesn't update access time)
      smallCache.set('key4', 'value4');

      expect(smallCache.get('key1')).toBeUndefined();
      expect(smallCache.get('key2')).toBe('value2');
      expect(smallCache.get('key3')).toBe('value3');
      expect(smallCache.get('key4')).toBe('value4');
      expect(smallCache.size()).toBe(3);
    });

    it('should return true for null values', () => {
      cache.set('key1', null);
      expect(cache.has('key1')).toBe(true);
    });

    it('should return true for undefined values', () => {
      cache.set('key1', undefined);
      expect(cache.has('key1')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.size()).toBe(3);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
    });

    it('should handle clearing empty cache', () => {
      expect(() => cache.clear()).not.toThrow();
      expect(cache.size()).toBe(0);
    });

    it('should allow adding entries after clear', () => {
      cache.set('key1', 'value1');
      cache.clear();
      cache.set('key2', 'value2');

      expect(cache.size()).toBe(1);
      expect(cache.get('key2')).toBe('value2');
    });
  });

  describe('size', () => {
    it('should return 0 for empty cache', () => {
      expect(cache.size()).toBe(0);
    });

    it('should return correct size', () => {
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);

      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);

      cache.set('key3', 'value3');
      expect(cache.size()).toBe(3);
    });

    it('should not count duplicate keys', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');

      expect(cache.size()).toBe(1);
    });

    it('should decrease when entry is deleted', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.delete('key1');

      expect(cache.size()).toBe(1);
    });

    it('should decrease when entry expires', () => {
      const shortTTLCache = new LRUCache(100, 10);
      shortTTLCache.set('key1', 'value1');

      const waitForExpiration = new Promise((resolve) => setTimeout(resolve, 15));

      return waitForExpiration.then(() => {
        // Check if exists to trigger expiration check
        shortTTLCache.has('key1');
        expect(shortTTLCache.size()).toBe(0);
      });
    });
  });

  describe('keys', () => {
    it('should return empty array for empty cache', () => {
      expect(cache.keys()).toEqual([]);
    });

    it('should return all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const keys = cache.keys();

      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
      expect(keys.length).toBe(3);
    });

    it('should not include deleted keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.delete('key1');

      expect(cache.keys()).not.toContain('key1');
      expect(cache.keys()).toContain('key2');
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      const shortTTLCache = new LRUCache(100, 10);
      shortTTLCache.set('key1', 'value1');
      shortTTLCache.set('key2', 'value2');

      const waitForExpiration = new Promise((resolve) => setTimeout(resolve, 15));

      return waitForExpiration.then(() => {
        const cleared = shortTTLCache.cleanup();
        expect(cleared).toBe(2);
        expect(shortTTLCache.size()).toBe(0);
      });
    });

    it('should return 0 when TTL is 0', () => {
      const noExpiryCache = new LRUCache(100, 0);
      noExpiryCache.set('key1', 'value1');

      const cleared = noExpiryCache.cleanup();

      expect(cleared).toBe(0);
      expect(noExpiryCache.size()).toBe(1);
    });

    it('should not remove non-expired entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const cleared = cache.cleanup();

      expect(cleared).toBe(0);
      expect(cache.size()).toBe(2);
    });

    it('should handle empty cache', () => {
      const cleared = cache.cleanup();
      expect(cleared).toBe(0);
    });
  });

  describe('configure', () => {
    it('should update max size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.configure({ maxSize: 2 });

      // Should evict to meet new size
      expect(cache.size()).toBeLessThanOrEqual(2);
    });

    it('should update TTL', () => {
      cache.set('key1', 'value1');

      cache.configure({ ttl: 0 });

      // Should no longer expire
      expect(cache.has('key1')).toBe(true);
    });

    it('should handle updating both size and TTL', () => {
      cache.configure({ maxSize: 50, ttl: 30000 });

      expect(cache.stats()).toEqual({
        size: 0,
        maxSize: 50,
        ttl: 30000,
      });
    });

    it('should evict entries when reducing size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.configure({ maxSize: 1 });

      expect(cache.size()).toBe(1);
    });

    it('should not evict when increasing size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.configure({ maxSize: 100 });

      expect(cache.size()).toBe(2);
    });
  });

  describe('stats', () => {
    it('should return default stats', () => {
      const defaultCache = new LRUCache();

      expect(defaultCache.stats()).toEqual({
        size: 0,
        maxSize: 100,
        ttl: 60000,
      });
    });

    it('should return custom stats', () => {
      const customCache = new LRUCache(50, 30000);

      expect(customCache.stats()).toEqual({
        size: 0,
        maxSize: 50,
        ttl: 30000,
      });
    });

    it('should reflect current size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      expect(cache.stats().size).toBe(2);
    });

    it('should reflect configuration changes', () => {
      cache.configure({ maxSize: 200, ttl: 120000 });

      expect(cache.stats()).toEqual({
        size: 0,
        maxSize: 200,
        ttl: 120000,
      });
    });
  });

  describe('Integration tests', () => {
    it('should handle complex usage pattern', async () => {
      const smallCache = new LRUCache(3);
      // Add entries
      smallCache.set('key1', 'value1');
      await new Promise(resolve => setTimeout(resolve, 2));
      smallCache.set('key2', 'value2');
      await new Promise(resolve => setTimeout(resolve, 2));
      smallCache.set('key3', 'value3');

      expect(smallCache.size()).toBe(3);

      // Access key1 to update LRU
      smallCache.get('key1');

      // Add key4, should evict key2 (oldest, since key1 was just accessed)
      smallCache.set('key4', 'value4');

      expect(smallCache.get('key1')).toBe('value1');
      expect(smallCache.get('key2')).toBeUndefined();
      expect(smallCache.get('key3')).toBe('value3');
      expect(smallCache.get('key4')).toBe('value4');

      // Delete key3
      smallCache.delete('key3');

      expect(smallCache.size()).toBe(2);

      // Update key1
      smallCache.set('key1', 'updated');

      expect(smallCache.get('key1')).toBe('updated');

      // Clear all
      smallCache.clear();

      expect(smallCache.size()).toBe(0);
    });

    it('should work with different TTL values', () => {
      const shortTTLCache = new LRUCache(10, 50);

      shortTTLCache.set('key1', 'value1');
      shortTTLCache.set('key2', 'value2');

      expect(shortTTLCache.has('key1')).toBe(true);
      expect(shortTTLCache.has('key2')).toBe(true);

      const waitForExpiration = new Promise((resolve) => setTimeout(resolve, 60));

      return waitForExpiration.then(() => {
        expect(shortTTLCache.get('key1')).toBeUndefined();
        expect(shortTTLCache.get('key2')).toBeUndefined();
      });
    });

    it('should handle mixed data types correctly', () => {
      const data = {
        string: 'text',
        number: 123,
        boolean: true,
        null: null,
        object: { nested: { value: 'deep' } },
        array: [1, 2, 3],
        date: new Date('2024-01-01'),
      };

      Object.entries(data).forEach(([key, value]) => {
        cache.set(key, value);
      });

      expect(cache.size()).toBe(Object.keys(data).length);

      Object.entries(data).forEach(([key, value]) => {
        const retrieved = cache.get(key);
        if (value instanceof Date) {
          expect(retrieved).toEqual(value);
        } else {
          expect(retrieved).toEqual(value);
        }
      });
    });

    it('should handle rapid set/delete cycles', () => {
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      expect(cache.size()).toBe(100);

      for (let i = 0; i < 50; i++) {
        cache.delete(`key${i}`);
      }

      expect(cache.size()).toBe(50);

      for (let i = 50; i < 100; i++) {
        expect(cache.get(`key${i}`)).toBe(`value${i}`);
      }
    });
  });
});
