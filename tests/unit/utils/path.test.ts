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
  });
});
