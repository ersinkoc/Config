/**
 * Unit tests for path utilities
 */

import { describe, it, expect } from 'vitest';
import { get, set, has, deletePath, toPathSegments, deepClone, getAllPaths } from '../../../src/utils/path.js';

describe('Path Utilities', () => {
  describe('toPathSegments', () => {
    it('should convert dot notation to segments', () => {
      expect(toPathSegments('database.host')).toEqual(['database', 'host']);
      expect(toPathSegments('a.b.c')).toEqual(['a', 'b', 'c']);
    });

    it('should handle array indices', () => {
      expect(toPathSegments('plugins[0].name')).toEqual(['plugins', '0', 'name']);
      expect(toPathSegments('items[1][2]')).toEqual(['items', '1', '2']);
    });

    it('should handle empty and invalid paths', () => {
      expect(toPathSegments('')).toEqual([]);
      expect(toPathSegments(undefined as any)).toEqual([]);
      expect(toPathSegments(null as any)).toEqual([]);
    });

    it('should handle non-string values', () => {
      expect(toPathSegments(123 as any)).toEqual([]);
    });

    it('should handle single segment', () => {
      expect(toPathSegments('name')).toEqual(['name']);
    });

    it('should handle multiple array indices', () => {
      expect(toPathSegments('arr[0][1]')).toEqual(['arr', '0', '1']);
    });

    it('should handle empty brackets', () => {
      expect(toPathSegments('arr[]')).toEqual(['arr']);
    });
  });

  describe('get', () => {
    it('should get nested values', () => {
      const obj = {
        database: {
          host: 'localhost',
          port: 5432,
        },
      };

      expect(get(obj, 'database.host')).toBe('localhost');
      expect(get(obj, 'database.port')).toBe(5432);
      expect(get(obj, 'database.missing')).toBeUndefined();
    });

    it('should return default value for missing paths', () => {
      const obj = { port: 3000 };

      expect(get(obj, 'port', 4000)).toBe(3000);
      expect(get(obj, 'missing', 'default')).toBe('default');
    });

    it('should handle null and undefined', () => {
      expect(get(null, 'test', 'default')).toBe('default');
      expect(get(undefined, 'test', 'default')).toBe('default');
    });

    it('should handle array indices', () => {
      const obj = { items: ['a', 'b', 'c'] };
      expect(get(obj, 'items[1]')).toBe('b');
    });

    it('should handle nested arrays', () => {
      const obj = { matrix: [[1, 2], [3, 4]] };
      expect(get(obj, 'matrix[0][1]')).toBe(2);
    });

    it('should return default for empty path', () => {
      const obj = { name: 'test' };
      expect(get(obj, '', 'default')).toBe('default');
    });

    it('should return default when traversing null', () => {
      const obj = { a: null };
      expect(get(obj, 'a.b', 'default')).toBe('default');
    });

    it('should handle deeply nested paths', () => {
      const obj = { a: { b: { c: { d: { e: 'deep' } } } } };
      expect(get(obj, 'a.b.c.d.e')).toBe('deep');
    });
  });

  describe('set', () => {
    it('should set nested values', () => {
      const obj: any = { database: {} };
      set(obj, 'database.host', 'localhost');
      expect(obj.database.host).toBe('localhost');
    });

    it('should create nested objects', () => {
      const obj: any = {};
      set(obj, 'database.host', 'localhost');
      expect(obj.database.host).toBe('localhost');
    });

    it('should create arrays for numeric segments', () => {
      const obj: any = {};
      set(obj, 'items[0]', 'first');
      expect(Array.isArray(obj.items)).toBe(true);
      expect(obj.items[0]).toBe('first');
    });

    it('should handle empty path', () => {
      const obj: any = { name: 'test' };
      set(obj, '', 'value');
      expect(obj.name).toBe('test');
    });

    it('should handle null/undefined object', () => {
      expect(() => set(null as any, 'name', 'value')).not.toThrow();
      expect(() => set(undefined as any, 'name', 'value')).not.toThrow();
    });

    it('should overwrite existing value', () => {
      const obj = { name: 'old' };
      set(obj, 'name', 'new');
      expect(obj.name).toBe('new');
    });

    it('should create intermediate objects', () => {
      const obj: any = {};
      set(obj, 'a.b.c', 'value');
      expect(obj.a.b.c).toBe('value');
    });
  });

  describe('has', () => {
    it('should check if path exists', () => {
      const obj = {
        port: 3000,
        database: {
          host: 'localhost',
        },
      };

      expect(has(obj, 'port')).toBe(true);
      expect(has(obj, 'database.host')).toBe(true);
      expect(has(obj, 'missing')).toBe(false);
      expect(has(obj, 'database.missing')).toBe(false);
    });

    it('should return false for empty path', () => {
      const obj = { name: 'test' };
      expect(has(obj, '')).toBe(false);
    });

    it('should return false for null/undefined object', () => {
      expect(has(null, 'name')).toBe(false);
      expect(has(undefined, 'name')).toBe(false);
    });

    it('should handle array indices', () => {
      const obj = { items: ['a', 'b'] };
      expect(has(obj, 'items[0]')).toBe(true);
      expect(has(obj, 'items[5]')).toBe(false);
    });

    it('should return false when traversing null', () => {
      const obj = { a: null };
      expect(has(obj, 'a.b')).toBe(false);
    });
  });

  describe('deletePath', () => {
    it('should delete nested values', () => {
      const obj: any = {
        port: 3000,
        host: 'localhost',
      };

      expect(deletePath(obj, 'port')).toBe(true);
      expect(has(obj, 'port')).toBe(false);
      expect(obj.host).toBe('localhost');
    });

    it('should return false for missing paths', () => {
      const obj = { port: 3000 };
      expect(deletePath(obj, 'missing')).toBe(false);
    });

    it('should return false for empty path', () => {
      const obj = { name: 'test' };
      expect(deletePath(obj, '')).toBe(false);
    });

    it('should return false for null/undefined object', () => {
      expect(deletePath(null, 'name')).toBe(false);
      expect(deletePath(undefined, 'name')).toBe(false);
    });

    it('should delete deeply nested values', () => {
      const obj = { database: { connection: { host: 'localhost', port: 5432 } } };
      expect(deletePath(obj, 'database.connection.port')).toBe(true);
      expect(has(obj, 'database.connection.port')).toBe(false);
      expect(has(obj, 'database.connection.host')).toBe(true);
    });

    it('should return false for partial path', () => {
      const obj = { database: {} };
      expect(deletePath(obj, 'database.host')).toBe(false);
    });
  });

  describe('deepClone', () => {
    it('should clone objects deeply', () => {
      const obj = {
        database: {
          host: 'localhost',
          ports: [5432, 5433],
        },
      };

      const cloned = deepClone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.database).not.toBe(obj.database);
      expect(cloned.database.ports).not.toBe(obj.database.ports);
    });

    it('should handle primitives', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('string')).toBe('string');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
    });

    it('should handle arrays', () => {
      const arr = [1, 2, 3];
      const cloned = deepClone(arr);
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-01');
      const cloned = deepClone(date);
      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
      expect(cloned.getTime()).toBe(date.getTime());
    });

    it('should handle mixed structures', () => {
      const obj = {
        name: 'test',
        items: [1, 2, 3],
        nested: { deep: { value: 'deep' } },
        date: new Date('2024-01-01'),
      };
      const cloned = deepClone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned.items).not.toBe(obj.items);
      expect(cloned.nested).not.toBe(obj.nested);
      expect(cloned.date).not.toBe(obj.date);
    });
  });

  describe('getAllPaths', () => {
    it('should get all paths in object', () => {
      const obj = {
        port: 3000,
        database: {
          host: 'localhost',
          port: 5432,
        },
      };

      const paths = getAllPaths(obj);
      expect(paths).toContain('port');
      expect(paths).toContain('database.host');
      expect(paths).toContain('database.port');
    });

    it('should handle empty objects', () => {
      expect(getAllPaths({})).toEqual([]);
      expect(getAllPaths(null)).toEqual([]);
    });

    it('should treat arrays as leaf values', () => {
      const obj = { items: [1, 2, 3] };
      const paths = getAllPaths(obj);
      expect(paths).toContain('items');
    });

    it('should return empty array for primitives', () => {
      expect(getAllPaths('string' as any)).toEqual([]);
      expect(getAllPaths(123 as any)).toEqual([]);
    });

    it('should handle deeply nested structures', () => {
      const obj = { a: { b: { c: { d: 'value' } } } };
      const paths = getAllPaths(obj);
      expect(paths).toContain('a.b.c.d');
    });
  });
});
