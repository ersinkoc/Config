// @ts-nocheck
/**
 * Tests for utils/path.ts
 */

import {
  toPathSegments,
  get,
  set,
  has,
  deletePath,
  deepClone,
  getAllPaths,
} from '../utils/path.js';

describe('toPathSegments', () => {
  it('should convert simple dot notation to segments', () => {
    expect(toPathSegments('a.b.c')).toEqual(['a', 'b', 'c']);
  });

  it('should convert bracket notation to segments', () => {
    expect(toPathSegments('plugins[0].name')).toEqual(['plugins', '0', 'name']);
    expect(toPathSegments('arr[1][2]')).toEqual(['arr', '1', '2']);
  });

  it('should handle mixed notation', () => {
    expect(toPathSegments('a.b[0].c')).toEqual(['a', 'b', '0', 'c']);
  });

  it('should handle single segment paths', () => {
    expect(toPathSegments('name')).toEqual(['name']);
  });

  it('should handle empty string', () => {
    expect(toPathSegments('')).toEqual([]);
  });

  it('should handle non-string input', () => {
    expect(toPathSegments(undefined as unknown as string)).toEqual([]);
    expect(toPathSegments(null as unknown as string)).toEqual([]);
    expect(toPathSegments(123 as unknown as string)).toEqual([]);
  });

  it('should handle paths with multiple dots', () => {
    expect(toPathSegments('a..b')).toEqual(['a', 'b']);
  });

  it('should handle trailing dots', () => {
    expect(toPathSegments('a.b.')).toEqual(['a', 'b']);
  });

  it('should handle leading dots', () => {
    expect(toPathSegments('.a.b')).toEqual(['a', 'b']);
  });

  it('should handle nested brackets', () => {
    expect(toPathSegments('a[0].b[1].c')).toEqual(['a', '0', 'b', '1', 'c']);
  });

  it('should handle brackets without content', () => {
    expect(toPathSegments('a[].b')).toEqual(['a', '', 'b']);
  });

  it('should handle complex bracket expressions', () => {
    expect(toPathSegments('items[42].name')).toEqual(['items', '42', 'name']);
  });
});

describe('get', () => {
  const obj = {
    a: 1,
    b: { c: 2, d: { e: 3 } },
    arr: [{ x: 1 }, { x: 2 }],
    null: null,
    undef: undefined,
  };

  it('should get value at simple path', () => {
    expect(get(obj, 'a')).toBe(1);
  });

  it('should get value at nested path', () => {
    expect(get(obj, 'b.c')).toBe(2);
    expect(get(obj, 'b.d.e')).toBe(3);
  });

  it('should get array element using bracket notation', () => {
    expect(get(obj, 'arr[0].x')).toBe(1);
    expect(get(obj, 'arr[1].x')).toBe(2);
  });

  it('should return undefined for non-existent path', () => {
    expect(get(obj, 'x.y.z')).toBeUndefined();
  });

  it('should return default value for non-existent path', () => {
    expect(get(obj, 'missing', 'default')).toBe('default');
    expect(get(obj, 'missing.path', 42)).toBe(42);
  });

  it('should return null value explicitly', () => {
    expect(get(obj, 'null')).toBeNull();
  });

  it('should return undefined value explicitly', () => {
    expect(get(obj, 'undef')).toBeUndefined();
  });

  it('should handle null object', () => {
    expect(get(null, 'a.b')).toBeUndefined();
    expect(get(null, 'a.b', 'default')).toBe('default');
  });

  it('should handle undefined object', () => {
    expect(get(undefined, 'a.b')).toBeUndefined();
  });

  it('should handle empty path', () => {
    expect(get(obj, '')).toBeUndefined();
  });

  it('should handle path through null intermediate', () => {
    const objWithNull = { a: null };
    expect(get(objWithNull, 'a.b')).toBeUndefined();
  });

  it('should get root object with empty path segments', () => {
    expect(get(obj, '.')).toBe(obj);
  });

  it('should handle zero as index', () => {
    const arr = ['a', 'b', 'c'];
    expect(get({ arr }, 'arr[0]')).toBe('a');
  });
});

describe('set', () => {
  it('should set value at simple path', () => {
    const obj: Record<string, unknown> = {};
    set(obj, 'a', 1);
    expect(obj.a).toBe(1);
  });

  it('should set value at nested path', () => {
    const obj: Record<string, unknown> = {};
    set(obj, 'a.b.c', 42);
    expect((obj.a as any)?.b?.c).toBe(42);
  });

  it('should set value in array using bracket notation', () => {
    const obj: Record<string, unknown> = {};
    set(obj, 'arr[0].name', 'test');
    expect(Array.isArray(obj.arr)).toBe(true);
    expect(obj.arr?.[0]?.name).toBe('test');
  });

  it('should create nested arrays for numeric indices', () => {
    const obj: Record<string, unknown> = {};
    set(obj, 'items[0]', 'first');
    expect(Array.isArray(obj.items)).toBe(true);
    expect(obj.items?.[0]).toBe('first');
  });

  it('should overwrite existing value', () => {
    const obj = { a: 1 };
    set(obj, 'a', 2);
    expect(obj.a).toBe(2);
  });

  it('should handle null object gracefully', () => {
    set(null, 'a.b', 1);
    // Should not throw
  });

  it('should handle undefined object gracefully', () => {
    set(undefined, 'a.b', 1);
    // Should not throw
  });

  it('should handle empty path', () => {
    const obj = { a: 1 };
    set(obj, '', 2);
    expect(obj.a).toBe(1);
  });

  it('should create intermediate objects', () => {
    const obj: Record<string, unknown> = {};
    set(obj, 'a.b.c.d.e', 'value');
    expect((obj.a as any)?.b?.c?.d?.e).toBe('value');
  });

  it('should handle setting null values', () => {
    const obj: Record<string, unknown> = {};
    set(obj, 'a.b', null);
    expect((obj.a as any)?.b).toBeNull();
  });

  it('should handle setting undefined values', () => {
    const obj: Record<string, unknown> = {};
    set(obj, 'a.b', undefined);
    expect('a' in obj).toBe(true);
    expect((obj.a as any)?.b).toBeUndefined();
  });

  it('should not modify existing structure when setting', () => {
    const obj = { a: { b: 1, c: 2 } };
    set(obj, 'a.d', 3);
    expect(obj.a).toEqual({ b: 1, c: 2, d: 3 });
  });

  it('should handle complex nested paths', () => {
    const obj: Record<string, unknown> = {};
    set(obj, 'config.database.host', 'localhost');
    expect((obj.config as any)?.database?.host).toBe('localhost');
  });
});

describe('has', () => {
  const obj = {
    a: 1,
    b: { c: 2 },
    null: null,
    undef: undefined,
    arr: [1, 2, 3],
  };

  it('should return true for existing simple path', () => {
    expect(has(obj, 'a')).toBe(true);
  });

  it('should return true for existing nested path', () => {
    expect(has(obj, 'b.c')).toBe(true);
  });

  it('should return false for non-existent path', () => {
    expect(has(obj, 'x.y')).toBe(false);
  });

  it('should return true for null value', () => {
    expect(has(obj, 'null')).toBe(true);
  });

  it('should return true for undefined value', () => {
    expect(has(obj, 'undef')).toBe(true);
  });

  it('should return false for path through null', () => {
    const objWithNull = { a: null };
    expect(has(objWithNull, 'a.b')).toBe(false);
  });

  it('should handle null object', () => {
    expect(has(null, 'a.b')).toBe(false);
  });

  it('should handle undefined object', () => {
    expect(has(undefined, 'a.b')).toBe(false);
  });

  it('should handle empty path', () => {
    expect(has(obj, '')).toBe(false);
  });

  it('should check array elements with bracket notation', () => {
    expect(has(obj, 'arr[0]')).toBe(true);
    expect(has(obj, 'arr[10]')).toBe(false);
  });

  it('should return false for non-existent array index', () => {
    expect(has(obj, 'arr[5]')).toBe(false);
  });
});

describe('deletePath', () => {
  it('should delete value at simple path', () => {
    const obj = { a: 1, b: 2 };
    const result = deletePath(obj, 'a');
    expect(result).toBe(true);
    expect(obj.a).toBeUndefined();
  });

  it('should delete value at nested path', () => {
    const obj = { a: { b: { c: 1 } } };
    const result = deletePath(obj, 'a.b.c');
    expect(result).toBe(true);
    expect(obj.a?.b?.c).toBeUndefined();
  });

  it('should return false for non-existent path', () => {
    const obj = { a: 1 };
    const result = deletePath(obj, 'x.y');
    expect(result).toBe(false);
  });

  it('should return false for null object', () => {
    expect(deletePath(null, 'a.b')).toBe(false);
  });

  it('should return false for undefined object', () => {
    expect(deletePath(undefined, 'a.b')).toBe(false);
  });

  it('should handle empty path', () => {
    const obj = { a: 1 };
    expect(deletePath(obj, '')).toBe(false);
  });

  it('should not affect other properties', () => {
    const obj = { a: 1, b: 2, c: 3 };
    deletePath(obj, 'b');
    expect(obj).toEqual({ a: 1, c: 3 });
  });

  it('should handle deleting from nested object', () => {
    const obj = { a: { b: 1, c: 2 } };
    deletePath(obj, 'a.b');
    expect(obj.a).toEqual({ c: 2 });
  });

  it('should return false when deleting non-existent nested key', () => {
    const obj = { a: { b: 1 } };
    expect(deletePath(obj, 'a.c')).toBe(false);
  });

  it('should handle deleting through null intermediate', () => {
    const obj = { a: null };
    expect(deletePath(obj, 'a.b')).toBe(false);
  });
});

describe('deepClone', () => {
  it('should clone primitives', () => {
    expect(deepClone(1)).toBe(1);
    expect(deepClone('string')).toBe('string');
    expect(deepClone(true)).toBe(true);
    expect(deepClone(null)).toBeNull();
    expect(deepClone(undefined)).toBeUndefined();
  });

  it('should clone plain objects', () => {
    const obj = { a: 1, b: { c: 2 } };
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.b).not.toBe(obj.b);
  });

  it('should clone arrays', () => {
    const arr = [1, [2, 3], { a: 4 }];
    const cloned = deepClone(arr);
    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr);
    expect(cloned[1]).not.toBe(arr[1]);
    expect(cloned[2]).not.toBe(arr[2]);
  });

  it('should clone Date objects', () => {
    const date = new Date('2024-01-01');
    const cloned = deepClone(date);
    expect(cloned).toBeInstanceOf(Date);
    expect(cloned.getTime()).toBe(date.getTime());
    expect(cloned).not.toBe(date);
  });

  it('should clone nested structures', () => {
    const obj = {
      a: {
        b: {
          c: {
            d: 1,
          },
        },
      },
    };
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned.a.b.c).not.toBe(obj.a.b.c);
  });

  it('should clone arrays within objects', () => {
    const obj = { arr: [{ a: 1 }, { b: 2 }] };
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned.arr).not.toBe(obj.arr);
    expect(cloned.arr[0]).not.toBe(obj.arr[0]);
  });

  it('should clone objects within arrays', () => {
    const arr = [{ a: { b: 1 } }, { c: { d: 2 } }];
    const cloned = deepClone(arr);
    expect(cloned).toEqual(arr);
    expect(cloned[0].a).not.toBe(arr[0].a);
  });

  it('should handle empty objects and arrays', () => {
    expect(deepClone({})).toEqual({});
    expect(deepClone([])).toEqual([]);
  });

  it('should not mutate original', () => {
    const obj = { a: { b: 1 } };
    const cloned = deepClone(obj);
    (cloned as { a: { b: number } }).a.b = 2;
    expect(obj.a.b).toBe(1);
  });

  it('should handle object with multiple properties', () => {
    const obj = { a: 1, b: 2, c: 3, d: { e: 4 } };
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    cloned.d.e = 5;
    expect(obj.d.e).toBe(4);
  });
});

describe('getAllPaths', () => {
  it('should return empty array for non-object', () => {
    expect(getAllPaths(null)).toEqual([]);
    expect(getAllPaths(undefined)).toEqual([]);
    expect(getAllPaths(42)).toEqual([]);
    expect(getAllPaths('string')).toEqual([]);
    expect(getAllPaths(true)).toEqual([]);
  });

  it('should return paths for flat object', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(getAllPaths(obj)).toEqual(['a', 'b', 'c']);
  });

  it('should return paths for nested object', () => {
    const obj = { a: { b: { c: 1 } } };
    expect(getAllPaths(obj)).toEqual(['a.b.c']);
  });

  it('should return paths for mixed structure', () => {
    const obj = {
      a: 1,
      b: { c: 2, d: { e: 3 } },
      f: 4,
    };
    const paths = getAllPaths(obj);
    expect(paths).toContain('a');
    expect(paths).toContain('b.c');
    expect(paths).toContain('b.d.e');
    expect(paths).toContain('f');
  });

  it('should handle arrays as leaf values', () => {
    const obj = { a: [1, 2, 3] };
    expect(getAllPaths(obj)).toEqual(['a']);
  });

  it('should handle arrays as non-leaf values', () => {
    const obj = { a: [{ b: 1 }, { c: 2 }] };
    const paths = getAllPaths(obj);
    expect(paths).toContain('a[0].b');
    expect(paths).toContain('a[1].c');
  });

  it('should handle null values', () => {
    const obj = { a: null, b: { c: null } };
    const paths = getAllPaths(obj);
    expect(paths).toContain('a');
    expect(paths).toContain('b.c');
  });

  it('should handle empty object', () => {
    expect(getAllPaths({})).toEqual([]);
  });

  it('should handle object with only nested objects', () => {
    const obj = { a: { b: { c: { d: 1 } } } };
    expect(getAllPaths(obj)).toEqual(['a.b.c.d']);
  });

  it('should use prefix parameter', () => {
    const obj = { a: 1, b: { c: 2 } };
    expect(getAllPaths(obj, 'root')).toEqual(['root.a', 'root.b.c']);
  });

  it('should handle complex nested structures', () => {
    const obj = {
      database: {
        host: 'localhost',
        port: 5432,
        credentials: {
          username: 'user',
          password: 'pass',
        },
      },
      server: {
        port: 3000,
      },
    };
    const paths = getAllPaths(obj);
    expect(paths.length).toBeGreaterThan(0);
    expect(paths).toContain('database.host');
    expect(paths).toContain('database.port');
    expect(paths).toContain('database.credentials.username');
    expect(paths).toContain('database.credentials.password');
    expect(paths).toContain('server.port');
  });

  it('should handle objects with boolean values', () => {
    const obj = { a: true, b: false };
    expect(getAllPaths(obj)).toEqual(['a', 'b']);
  });

  it('should skip inherited properties', () => {
    const obj = Object.create({ inherited: 1 });
    obj.own = 2;
    const paths = getAllPaths(obj);
    expect(paths).toContain('own');
    expect(paths).not.toContain('inherited');
  });
});
