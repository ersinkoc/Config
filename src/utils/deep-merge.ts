/**
 * Deep merge implementation with customizable strategies.
 */

import type { MergeStrategy, MergeStrategyOptions } from '../types.js';

/**
 * Selects the merge strategy for a given path.
 *
 * @param path - Current path being merged
 * @param strategies - Merge strategy options
 * @returns Selected strategy
 *
 * @example
 * ```typescript
 * const strategies = {
 *   default: 'merge',
 *   arrays: 'unique',
 *   paths: { 'server.plugins': 'append' }
 * };
 * selectStrategy('database.host', strategies) // 'merge'
 * selectStrategy('server.plugins', strategies) // 'append'
 * ```
 */
export function selectStrategy(
  path: string,
  strategies?: MergeStrategyOptions
): MergeStrategy {
  if (!strategies) {
    return 'merge';
  }

  // Check path-specific strategy first
  if (strategies.paths && path in strategies.paths) {
    const strategy = strategies.paths[path];
    if (strategy) return strategy;
  }

  // Check if path contains array index
  const hasArrayIndex = /\[\d+\]/.test(path);
  if (hasArrayIndex && strategies.arrays) {
    return strategies.arrays;
  }

  // Return default strategy
  return strategies.default || 'merge';
}

/**
 * Merges two arrays based on the specified strategy.
 *
 * @param target - Target array
 * @param source - Source array
 * @param strategy - Merge strategy
 * @returns Merged array
 *
 * @example
 * ```typescript
 * mergeArrays([1, 2], [3, 4], 'append') // [1, 2, 3, 4]
 * mergeArrays([1, 2], [2, 3], 'unique') // [1, 2, 3]
 * mergeArrays([1, 2], [3, 4], 'prepend') // [3, 4, 1, 2]
 * ```
 */
export function mergeArrays(
  target: unknown[],
  source: unknown[],
  strategy: MergeStrategy
): unknown[] {
  switch (strategy) {
    case 'replace':
      return [...source];

    case 'append':
      return [...target, ...source];

    case 'prepend':
      return [...source, ...target];

    case 'unique':
      const result: unknown[] = [...target];

      for (const item of source) {
        const isDuplicate = result.some(
          (existing) =>
            JSON.stringify(existing) === JSON.stringify(item)
        );

        if (!isDuplicate) {
          result.push(item);
        }
      }

      return result;

    default:
      // For 'merge' strategy on arrays, fall back to replace
      return [...source];
  }
}

/**
 * Performs deep merge of two values based on strategy.
 *
 * @param target - Target value
 * @param source - Source value
 * @param strategy - Merge strategy
 * @param path - Current path (for error reporting)
 * @returns Merged value
 *
 * @example
 * ```typescript
 * deepMerge({ a: 1 }, { a: 2 }, 'replace', 'a') // { a: 2 }
 * deepMerge({ a: { b: 1 } }, { a: { c: 2 } }, 'merge', 'a') // { a: { b: 1, c: 2 } }
 * deepMerge([1, 2], [3, 4], 'append', 'arr') // [1, 2, 3, 4]
 * ```
 */
export function deepMerge(
  target: unknown,
  source: unknown,
  strategy: MergeStrategy,
  path: string
): unknown {
  // If source is null, use source (allows nulling values)
  if (source === null) {
    return null;
  }

  // If source is undefined, return target
  if (source === undefined) {
    return target;
  }

  // Handle primitive types (replace strategy)
  if (
    target === undefined ||
    target === null ||
    typeof target !== 'object' ||
    typeof source !== 'object' ||
    Array.isArray(target) !== Array.isArray(source)
  ) {
    return source;
  }

  // Handle arrays
  if (Array.isArray(source)) {
    if (!Array.isArray(target)) {
      // Target is not an array, replace with source array
      return [...source];
    }

    // Both are arrays, merge based on strategy
    return mergeArrays(target as unknown[], source, strategy);
  }

  // Handle objects
  const targetObj = target as Record<string, unknown>;
  const sourceObj = source as Record<string, unknown>;

  // If strategy is 'replace', return source
  if (strategy === 'replace') {
    return { ...sourceObj };
  }

  // If strategy is 'merge', deep merge properties
  const result: Record<string, unknown> = { ...targetObj };

  for (const key in sourceObj) {
    if (!sourceObj.hasOwnProperty(key)) {
      continue;
    }

    const sourceValue = sourceObj[key];
    const targetValue = targetObj[key];
    const currentPath = path ? `${path}.${key}` : key;

    if (sourceValue === undefined) {
      continue;
    }

    if (sourceValue === null) {
      result[key] = null;
      continue;
    }

    if (targetValue === undefined) {
      // Target doesn't have this key, just add it
      result[key] = sourceValue;
      continue;
    }

    // Both have the key, recursively merge
    result[key] = deepMerge(targetValue, sourceValue, strategy, currentPath);
  }

  return result;
}

/**
 * Merges multiple configuration objects with strategy.
 *
 * @param configs - Array of configuration objects (processed in order)
 * @param strategies - Merge strategy options
 * @returns Merged configuration
 *
 * @example
 * ```typescript
 * const configs = [
 *   { a: 1, b: { c: 2 } },
 *   { b: { d: 3 }, e: 4 },
 *   { b: { c: 5 } }
 * ];
 * mergeConfigs(configs, { default: 'merge' });
 * // Result: { a: 1, b: { c: 5, d: 3 }, e: 4 }
 * ```
 */
export function mergeConfigs(
  configs: Record<string, unknown>[],
  strategies?: MergeStrategyOptions
): Record<string, unknown> {
  if (!configs || configs.length === 0) {
    return {};
  }

  if (configs.length === 1) {
    return { ...configs[0] };
  }

  let result: Record<string, unknown> = {};

  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    const strategy = selectStrategy('', strategies);
    result = deepMerge(result, config, strategy, '') as Record<string, unknown>;
  }

  return result;
}

/**
 * Deep merges two objects with customizable strategies.
 *
 * @param target - Target object
 * @param source - Source object
 * @param strategies - Merge strategy options
 * @returns Merged object
 *
 * @example
 * ```typescript
 * merge({ a: 1 }, { a: 2 }) // { a: 2 }
 * merge({ a: { b: 1 } }, { a: { c: 2 } }) // { a: { b: 1, c: 2 } }
 * merge([1, 2], [3, 4], { arrays: 'append' }) // [1, 2, 3, 4]
 * ```
 */
export function merge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  strategies?: MergeStrategyOptions
): Record<string, unknown> {
  const strategy = selectStrategy('', strategies);
  return deepMerge(target, source, strategy, '') as Record<string, unknown>;
}
