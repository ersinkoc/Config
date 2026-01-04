/**
 * Path utilities for getting, setting, and manipulating nested object values
 * using dot notation (e.g., 'database.host', 'features.logging.level').
 */

/**
 * Converts a dot-notation path to an array of path segments.
 *
 * @param path - Dot-notation path (e.g., 'database.host')
 * @returns Array of path segments
 *
 * @example
 * ```typescript
 * toPathSegments('database.host') // ['database', 'host']
 * toPathSegments('plugins[0].name') // ['plugins', '0', 'name']
 * ```
 */
export function toPathSegments(path: string): string[] {
  if (!path || typeof path !== 'string') {
    return [];
  }

  const segments: string[] = [];
  let current = '';
  let inBrackets = false;
  let bracketContent = '';

  for (let i = 0; i < path.length; i++) {
    const char = path[i];

    if (char === '[') {
      if (current) {
        segments.push(current);
        current = '';
      }
      inBrackets = true;
      bracketContent = '';
    } else if (char === ']') {
      if (bracketContent) {
        segments.push(bracketContent);
        bracketContent = '';
      }
      inBrackets = false;
    } else if (char === '.' && !inBrackets) {
      if (current) {
        segments.push(current);
        current = '';
      }
    } else if (inBrackets) {
      bracketContent += char;
    } else {
      current += char;
    }
  }

  if (current) {
    segments.push(current);
  }

  return segments;
}

/**
 * Gets a value from a nested object using dot notation.
 *
 * @param obj - Object to get value from
 * @param path - Dot-notation path (e.g., 'database.host')
 * @param defaultValue - Default value if path doesn't exist
 * @returns Value at path or defaultValue
 *
 * @example
 * ```typescript
 * const obj = { database: { host: 'localhost', port: 5432 } };
 * get(obj, 'database.host') // 'localhost'
 * get(obj, 'database.password', 'default') // 'default'
 * ```
 */
export function get<T = unknown>(obj: unknown, path: string, defaultValue?: T): T | undefined {
  if (!obj || !path) {
    return defaultValue;
  }

  const segments = toPathSegments(path);
  let current: any = obj;

  for (const segment of segments) {
    if (current == null) {
      return defaultValue;
    }

    current = current[segment];
  }

  return current !== undefined ? current : defaultValue;
}

/**
 * Sets a value in a nested object using dot notation.
 *
 * @param obj - Object to set value in
 * @param path - Dot-notation path (e.g., 'database.host')
 * @param value - Value to set
 *
 * @example
 * ```typescript
 * const obj = { database: {} };
 * set(obj, 'database.host', 'localhost');
 * // obj = { database: { host: 'localhost' } }
 * ```
 */
export function set(obj: unknown, path: string, value: unknown): void {
  if (!obj || !path) {
    return;
  }

  const segments = toPathSegments(path);

  if (segments.length === 0) {
    return;
  }

  let current: any = obj;

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    if (segment === undefined) continue;

    if (current[segment] == null) {
      const nextSegment = segments[i + 1];
      // Check if next segment is a numeric string (array index)
      const isNumericIndex = typeof nextSegment === 'string' && /^\d+$/.test(nextSegment);
      current[segment] = isNumericIndex ? [] : {};
    }

    current = current[segment];
  }

  const lastSegment = segments[segments.length - 1];
  if (lastSegment !== undefined) {
    current[lastSegment] = value;
  }
}

/**
 * Checks if a path exists in an object.
 *
 * @param obj - Object to check
 * @param path - Dot-notation path
 * @returns True if path exists
 *
 * @example
 * ```typescript
 * const obj = { database: { host: 'localhost' } };
 * has(obj, 'database.host') // true
 * has(obj, 'database.port') // false
 * ```
 */
export function has(obj: unknown, path: string): boolean {
  if (!obj || !path) {
    return false;
  }

  const segments = toPathSegments(path);
  let current: any = obj;

  for (const segment of segments) {
    if (current == null || !(segment in current)) {
      return false;
    }

    current = current[segment];
  }

  return true;
}

/**
 * Deletes a value from a nested object using dot notation.
 *
 * @param obj - Object to delete from
 * @param path - Dot-notation path
 * @returns True if value was deleted
 *
 * @example
 * ```typescript
 * const obj = { database: { host: 'localhost', port: 5432 } };
 * delete(obj, 'database.port') // true
 * // obj = { database: { host: 'localhost' } }
 * ```
 */
export function deletePath(obj: unknown, path: string): boolean {
  if (!obj || !path) {
    return false;
  }

  const segments = toPathSegments(path);

  if (segments.length === 0) {
    return false;
  }

  const lastSegment = segments[segments.length - 1];
  let current: any = obj;

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    if (segment === undefined) return false;

    if (current[segment] == null) {
      return false;
    }

    current = current[segment];
  }

  if (lastSegment !== undefined && lastSegment in current) {
    delete current[lastSegment];
    return true;
  }

  return false;
}

/**
 * Creates a deep clone of an object.
 *
 * @param obj - Object to clone
 * @returns Deep clone of object
 *
 * @example
 * ```typescript
 * const obj = { database: { host: 'localhost' } };
 * const clone = deepClone(obj);
 * clone.database.host = 'different';
 * // obj.database.host remains 'localhost'
 * ```
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  const cloned = {} as T;

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}

/**
 * Gets all paths in an object (leaf nodes only).
 *
 * @param obj - Object to inspect
 * @param prefix - Path prefix (internal use)
 * @returns Array of paths
 *
 * @example
 * ```typescript
 * const obj = { database: { host: 'localhost', port: 5432 } };
 * getAllPaths(obj) // ['database.host', 'database.port']
 * ```
 */
export function getAllPaths(obj: unknown, prefix = ''): string[] {
  const paths: string[] = [];

  if (!obj || typeof obj !== 'object') {
    return paths;
  }

  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }

    const value = (obj as Record<string, unknown>)[key];
    const path = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      paths.push(...getAllPaths(value, path));
    } else {
      paths.push(path);
    }
  }

  return paths;
}
