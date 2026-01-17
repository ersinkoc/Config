// @ts-nocheck
/**
 * Tests for utils/deep-merge.ts
 */

import {
  selectStrategy,
  mergeArrays,
  deepMerge,
  mergeConfigs,
  merge,
} from '../utils/deep-merge.js';
import type { MergeStrategyOptions } from '../types.js';

describe('selectStrategy', () => {
  it('should return merge as default strategy', () => {
    expect(selectStrategy('any.path')).toBe('merge');
    expect(selectStrategy('any.path', undefined)).toBe('merge');
  });

  it('should use path-specific strategy when defined', () => {
    const options: MergeStrategyOptions = {
      default: 'merge',
      paths: {
        'server.plugins': 'append',
        'database.hosts': 'replace',
      },
    };
    expect(selectStrategy('server.plugins', options)).toBe('append');
    expect(selectStrategy('database.hosts', options)).toBe('replace');
  });

  it('should use array strategy for paths with array indices', () => {
    const options: MergeStrategyOptions = {
      arrays: 'unique',
    };
    expect(selectStrategy('items[0]', options)).toBe('unique');
    expect(selectStrategy('list[5].name', options)).toBe('unique');
  });

  it('should prioritize path-specific over array strategy', () => {
    const options: MergeStrategyOptions = {
      default: 'merge',
      arrays: 'append',
      paths: {
        'items[0]': 'replace',
      },
    };
    expect(selectStrategy('items[0]', options)).toBe('replace');
  });

  it('should use default when no specific strategy matches', () => {
    const options: MergeStrategyOptions = {
      default: 'replace',
      arrays: 'append',
    };
    expect(selectStrategy('some.path', options)).toBe('replace');
  });

  it('should handle empty path-specific options', () => {
    const options: MergeStrategyOptions = {
      paths: {},
    };
    expect(selectStrategy('any.path', options)).toBe('merge');
  });

  it('should handle paths not in path-specific options', () => {
    const options: MergeStrategyOptions = {
      paths: {
        'other.path': 'replace',
      },
    };
    expect(selectStrategy('some.path', options)).toBe('merge');
  });
});

describe('mergeArrays', () => {
  it('should replace arrays with replace strategy', () => {
    const target = [1, 2, 3];
    const source = [4, 5, 6];
    expect(mergeArrays(target, source, 'replace')).toEqual([4, 5, 6]);
  });

  it('should append arrays with append strategy', () => {
    const target = [1, 2, 3];
    const source = [4, 5, 6];
    expect(mergeArrays(target, source, 'append')).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('should prepend arrays with prepend strategy', () => {
    const target = [1, 2, 3];
    const source = [4, 5, 6];
    expect(mergeArrays(target, source, 'prepend')).toEqual([4, 5, 6, 1, 2, 3]);
  });

  it('should merge arrays uniquely with unique strategy', () => {
    const target = [1, 2, 3];
    const source = [2, 3, 4];
    expect(mergeArrays(target, source, 'unique')).toEqual([1, 2, 3, 4]);
  });

  it('should use replace (default) for unknown strategy', () => {
    const target = [1, 2];
    const source = [3, 4];
    expect(mergeArrays(target, source, 'merge' as any)).toEqual([3, 4]);
  });

  it('should handle unique with objects using JSON comparison', () => {
    const target = [{ id: 1 }, { id: 2 }];
    const source = [{ id: 2 }, { id: 3 }];
    const result = mergeArrays(target, source, 'unique');
    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  it('should handle empty arrays', () => {
    expect(mergeArrays([], [1, 2], 'append')).toEqual([1, 2]);
    expect(mergeArrays([1, 2], [], 'append')).toEqual([1, 2]);
    expect(mergeArrays([], [], 'append')).toEqual([]);
  });

  it('should handle arrays with different types', () => {
    const target = [1, 'two', true];
    const source = [false, 'three', 4];
    expect(mergeArrays(target, source, 'append')).toEqual([1, 'two', true, false, 'three', 4]);
  });

  it('should handle unique with duplicate primitives', () => {
    const target = [1, 2, 2, 3];
    const source = [3, 4, 4, 5];
    const result = mergeArrays(target, source, 'unique');
    // unique strategy removes ALL duplicates, not just from source
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it('should handle unique with null and undefined', () => {
    const target = [1, null, 2];
    const source = [null, 3, undefined];
    const result = mergeArrays(target, source, 'unique');
    expect(result).toEqual([1, null, 2, 3, undefined]);
  });
});

describe('deepMerge', () => {
  it('should return source when target is undefined', () => {
    expect(deepMerge(undefined, { a: 1 }, 'merge', '')).toEqual({ a: 1 });
  });

  it('should return target when source is undefined', () => {
    expect(deepMerge({ a: 1 }, undefined, 'merge', '')).toEqual({ a: 1 });
  });

  it('should return null when source is null', () => {
    expect(deepMerge({ a: 1 }, null, 'merge', '')).toBeNull();
  });

  it('should replace primitive values', () => {
    expect(deepMerge(1, 2, 'merge', '')).toBe(2);
    expect(deepMerge('a', 'b', 'merge', '')).toBe('b');
    expect(deepMerge(true, false, 'merge', '')).toBe(false);
  });

  it('should replace with replace strategy', () => {
    const target = { a: 1, b: { c: 2 } };
    const source = { a: 10, b: { d: 20 } };
    expect(deepMerge(target, source, 'replace', '')).toEqual({ a: 10, b: { d: 20 } });
  });

  it('should merge objects with merge strategy', () => {
    const target = { a: 1, b: { c: 2 } };
    const source = { b: { d: 3 }, e: 4 };
    const result = deepMerge(target, source, 'merge', '') as Record<string, unknown>;
    expect(result.a).toBe(1);
    expect(result.b).toEqual({ c: 2, d: 3 });
    expect(result.e).toBe(4);
  });

  it('should merge arrays based on strategy', () => {
    const target = { items: [1, 2] };
    const source = { items: [3, 4] };
    const appendResult = deepMerge(target, source, 'append', '') as Record<string, unknown>;
    expect(appendResult.items).toEqual([1, 2, 3, 4]);
  });

  it('should replace when target is not array but source is', () => {
    const target = { items: 'not-array' };
    const source = { items: [1, 2, 3] };
    const result = deepMerge(target, source, 'merge', '') as Record<string, unknown>;
    expect(result.items).toEqual([1, 2, 3]);
  });

  it('should replace when target is array but source is not', () => {
    const target = { items: [1, 2, 3] };
    const source = { items: 'not-array' };
    const result = deepMerge(target, source, 'merge', '') as Record<string, unknown>;
    expect(result.items).toBe('not-array');
  });

  it('should handle deeply nested objects', () => {
    const target = { a: { b: { c: { d: 1 } } } };
    const source = { a: { b: { c: { e: 2 } } } };
    const result = deepMerge(target, source, 'merge', '') as Record<string, unknown>;
    expect((result.a as any).b.c).toEqual({ d: 1, e: 2 });
  });

  it('should skip undefined source values', () => {
    const target = { a: 1, b: 2 };
    const source = { b: undefined, c: 3 };
    const result = deepMerge(target, source, 'merge', '') as Record<string, unknown>;
    expect(result.a).toBe(1);
    expect(result.b).toBe(2);
    expect(result.c).toBe(3);
  });

  it('should allow nulling values', () => {
    const target = { a: 1, b: { c: 2 } };
    const source = { a: null, b: { c: null } };
    const result = deepMerge(target, source, 'merge', '') as Record<string, unknown>;
    expect(result.a).toBeNull();
    expect((result.b as any).c).toBeNull();
  });

  it('should add new keys from source', () => {
    const target = { a: 1 };
    const source = { b: 2, c: 3 };
    const result = deepMerge(target, source, 'merge', '') as Record<string, unknown>;
    expect(result.a).toBe(1);
    expect(result.b).toBe(2);
    expect(result.c).toBe(3);
  });

  it('should handle merging when target key does not exist', () => {
    const target = { a: 1 };
    const source = { b: { c: 2 } };
    const result = deepMerge(target, source, 'merge', '') as Record<string, unknown>;
    expect(result.b).toEqual({ c: 2 });
  });

  it('should handle complex merge scenarios', () => {
    const target = {
      server: { port: 3000, host: 'localhost' },
      database: { host: 'localhost', port: 5432 },
      features: ['auth', 'logging'],
    };
    const source = {
      server: { port: 4000 },
      database: { credentials: { user: 'admin' } },
      features: ['cache'],
    };
    const result = deepMerge(target, source, 'merge', '') as Record<string, unknown>;
    expect((result.server as any).port).toBe(4000);
    expect((result.server as any).host).toBe('localhost');
    expect(result.database).toEqual({
      host: 'localhost',
      port: 5432,
      credentials: { user: 'admin' },
    });
  });

  it('should handle Date objects', () => {
    const date1 = new Date('2024-01-01');
    const date2 = new Date('2024-02-01');
    expect(deepMerge(date1, date2, 'merge', '')).toEqual(date2);
  });

  it('should handle arrays in objects', () => {
    const target = { items: [{ id: 1 }, { id: 2 }] };
    const source = { items: [{ id: 3 }] };
    const appendResult = deepMerge(target, source, 'append', '') as Record<string, unknown>;
    expect(appendResult.items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  it('should handle mixed types', () => {
    const target = { a: 1, b: 'text', c: true };
    const source = { a: 2, b: 'new', c: false };
    const result = deepMerge(target, source, 'merge', '') as Record<string, unknown>;
    expect(result.a).toBe(2);
    expect(result.b).toBe('new');
    expect(result.c).toBe(false);
  });
});

describe('mergeConfigs', () => {
  it('should return empty object for empty array', () => {
    expect(mergeConfigs([])).toEqual({});
  });

  it('should return single config unchanged', () => {
    const config = { a: 1, b: 2 };
    expect(mergeConfigs([config])).toEqual({ a: 1, b: 2 });
    // Should be a clone
    expect(mergeConfigs([config])).not.toBe(config);
  });

  it('should merge multiple configs', () => {
    const configs = [
      { a: 1 },
      { b: 2 },
      { a: 10, c: 3 },
    ];
    const result = mergeConfigs(configs);
    expect(result).toEqual({ a: 10, b: 2, c: 3 });
  });

  it('should apply strategies to merge', () => {
    const configs = [
      { items: [1] },
      { items: [2] },
      { items: [3] },
    ];
    const appendResult = mergeConfigs(configs, { arrays: 'append' });
    expect(appendResult.items).toEqual([1, 2, 3]);
  });

  it('should handle deep nested configs', () => {
    const configs = [
      { a: { b: { c: 1 } } },
      { a: { b: { d: 2 } } },
      { a: { e: 3 } },
    ];
    const result = mergeConfigs(configs);
    expect(result.a.b).toEqual({ c: 1, d: 2 });
    expect(result.a.e).toBe(3);
  });

  it('should respect path-specific strategies', () => {
    const configs = [
      { items: [1, 2], other: { value: 1 } },
      { items: [3, 4], other: { value: 2 } },
    ];
    const result = mergeConfigs(configs, {
      default: 'merge',
      arrays: 'append',
      paths: { 'items': 'replace' },
    });
    expect(result.items).toEqual([3, 4]);
    expect(result.other.value).toBe(2);
  });

  it('should handle configs with null values', () => {
    const configs = [{ a: 1 }, { a: null }, { b: 2 }];
    const result = mergeConfigs(configs);
    expect(result.a).toBeNull();
    expect(result.b).toBe(2);
  });

  it('should handle undefined strategies', () => {
    const configs = [{ a: 1 }, { b: 2 }];
    expect(mergeConfigs(configs, undefined)).toEqual({ a: 1, b: 2 });
  });

  it('should process configs in order', () => {
    const configs = [
      { value: 1 },
      { value: 2 },
      { value: 3 },
    ];
    const result = mergeConfigs(configs);
    expect(result.value).toBe(3);
  });
});

describe('merge', () => {
  it('should merge two simple objects', () => {
    const target = { a: 1 };
    const source = { b: 2 };
    expect(merge(target, source)).toEqual({ a: 1, b: 2 });
  });

  it('should merge two complex objects', () => {
    const target = { a: 1, b: { c: 2 } };
    const source = { b: { d: 3 }, e: 4 };
    const result = merge(target, source);
    expect(result.a).toBe(1);
    expect(result.b).toEqual({ c: 2, d: 3 });
    expect(result.e).toBe(4);
  });

  it('should use replace strategy by default', () => {
    const target = { a: { b: 1 } };
    const source = { a: { c: 2 } };
    const result = merge(target, source, { default: 'replace' });
    expect(result.a).toEqual({ c: 2 });
  });

  it('should use merge strategy when specified', () => {
    const target = { a: { b: 1 } };
    const source = { a: { c: 2 } };
    const result = merge(target, source, { default: 'merge' });
    expect(result.a).toEqual({ b: 1, c: 2 });
  });

  it('should handle arrays with array strategy', () => {
    const target = { items: [1, 2] };
    const source = { items: [3, 4] };
    const result = merge(target, source, { arrays: 'append' });
    expect(result.items).toEqual([1, 2, 3, 4]);
  });

  it('should handle path-specific strategies', () => {
    const target = {
      arr1: [1],
      arr2: [1],
      other: { value: 1 },
    };
    const source = {
      arr1: [2],
      arr2: [2],
      other: { value: 2 },
    };
    const result = merge(target, source, {
      paths: {
        'arr1': 'append',
        'arr2': 'replace',
      },
    });
    expect(result.arr1).toEqual([1, 2]);
    expect(result.arr2).toEqual([2]);
    expect(result.other.value).toBe(2);
  });

  it('should create new object (not mutate inputs)', () => {
    const target = { a: 1 };
    const source = { b: 2 };
    const result = merge(target, source);
    expect(target).toEqual({ a: 1 });
    expect(source).toEqual({ b: 2 });
    expect(result).not.toBe(target);
    expect(result).not.toBe(source);
  });

  it('should handle empty target', () => {
    expect(merge({}, { a: 1 })).toEqual({ a: 1 });
  });

  it('should handle empty source', () => {
    expect(merge({ a: 1 }, {})).toEqual({ a: 1 });
  });

  it('should handle both empty', () => {
    expect(merge({}, {})).toEqual({});
  });

  it('should handle multiple levels of nesting', () => {
    const target = {
      level1: {
        level2: {
          level3: { value: 1 },
        },
      },
    };
    const source = {
      level1: {
        level2: {
          level3: { other: 2 },
        },
      },
    };
    const result = merge(target, source);
    expect(result.level1.level2.level3).toEqual({ value: 1, other: 2 });
  });
});

describe('Integration tests', () => {
  it('should handle complex real-world config merge', () => {
    const baseConfig = {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      database: {
        host: 'localhost',
        port: 5432,
      },
      features: ['logging'],
    };

    const envConfig = {
      server: {
        port: 4000,
      },
      database: {
        password: 'secret',
      },
      features: ['auth'],
    };

    const localConfig = {
      server: {
        ssl: true,
      },
      features: ['debug'],
    };

    const result = mergeConfigs([baseConfig, envConfig, localConfig], {
      default: 'merge',
      arrays: 'append',
    });

    expect(result.server).toEqual({
      port: 4000,
      host: '0.0.0.0',
      ssl: true,
    });
    expect(result.database).toEqual({
      host: 'localhost',
      port: 5432,
      password: 'secret',
    });
    expect(result.features).toEqual(['logging', 'auth', 'debug']);
  });
});
