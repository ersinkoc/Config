/**
 * Unit tests for deep merge utilities
 */

import { describe, it, expect } from 'vitest';
import { merge, deepMerge, selectStrategy, mergeArrays, mergeConfigs } from '../../../src/utils/deep-merge.js';

describe('Deep Merge Utilities', () => {
  describe('selectStrategy', () => {
    it('should select default strategy', () => {
      const strategies = { default: 'merge' as const };
      expect(selectStrategy('any.path', strategies)).toBe('merge');
    });

    it('should select path-specific strategy', () => {
      const strategies = {
        paths: { 'database.host': 'replace' as const },
      };
      expect(selectStrategy('database.host', strategies)).toBe('replace');
      expect(selectStrategy('other.path', strategies)).toBe('merge');
    });

    it('should select array strategy', () => {
      const strategies = { arrays: 'append' as const };
      expect(selectStrategy('items[0]', strategies)).toBe('append');
    });

    it('should return merge when no strategies', () => {
      expect(selectStrategy('path', undefined)).toBe('merge');
    });
  });

  describe('mergeArrays', () => {
    it('should replace arrays', () => {
      expect(mergeArrays([1, 2], [3, 4], 'replace')).toEqual([3, 4]);
    });

    it('should append arrays', () => {
      expect(mergeArrays([1, 2], [3, 4], 'append')).toEqual([1, 2, 3, 4]);
    });

    it('should prepend arrays', () => {
      expect(mergeArrays([1, 2], [3, 4], 'prepend')).toEqual([3, 4, 1, 2]);
    });

    it('should merge arrays with unique values', () => {
      expect(mergeArrays([1, 2], [2, 3], 'unique')).toEqual([1, 2, 3]);
    });
  });

  describe('deepMerge', () => {
    it('should merge objects', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };

      const result = deepMerge(target, source, 'merge', '');
      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });

    it('should replace primitives', () => {
      const target = { a: 1 };
      const source = { a: 2 };

      const result = deepMerge(target, source, 'replace', '');
      expect(result).toEqual({ a: 2 });
    });

    it('should handle null values', () => {
      const target = { a: 1 };
      const source = { a: null };

      const result = deepMerge(target, source, 'merge', '');
      expect(result).toEqual({ a: null });
    });

    it('should handle undefined values', () => {
      const target = { a: 1 };
      const source = { a: undefined };

      const result = deepMerge(target, source, 'merge', '');
      expect(result).toEqual({ a: 1 });
    });

    it('should merge arrays with strategy', () => {
      const target = { items: [1, 2] };
      const source = { items: [3, 4] };

      const result = deepMerge(target, source, 'append', 'items');
      expect(result).toEqual({ items: [1, 2, 3, 4] });
    });
  });

  describe('merge', () => {
    it('should merge two objects', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };

      const result = merge(target, source);
      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should use merge strategy by default', () => {
      const target = { nested: { a: 1 } };
      const source = { nested: { b: 2 } };

      const result = merge(target, source);
      expect(result).toEqual({ nested: { a: 1, b: 2 } });
    });
  });

  describe('mergeConfigs', () => {
    it('should merge multiple configs', () => {
      const configs = [
        { a: 1, b: { c: 2 } },
        { b: { d: 3 }, e: 4 },
        { b: { c: 5 } },
      ];

      const result = mergeConfigs(configs);
      expect(result).toEqual({ a: 1, b: { c: 5, d: 3 }, e: 4 });
    });

    it('should handle empty array', () => {
      expect(mergeConfigs([])).toEqual({});
    });

    it('should handle single config', () => {
      const result = mergeConfigs([{ a: 1 }]);
      expect(result).toEqual({ a: 1 });
    });
  });
});
