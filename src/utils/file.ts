/**
 * File system utilities for configuration loading.
 */

import { readFile as fsReadFile, stat as fsStat } from 'node:fs/promises';
import { existsSync, watch as fsWatch } from 'node:fs';
import { dirname, join, normalize, resolve } from 'node:path';
import type { ConfigParser } from '../types.js';
import { ConfigNotFoundError, ParseError } from '../errors.js';

/**
 * Reads file content asynchronously.
 *
 * @param filePath - Path to file
 * @returns File content
 *
 * @example
 * ```typescript
 * const content = await readFile('./config.yaml');
 * ```
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    const content = await fsReadFile(filePath, 'utf-8');
    return content;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new ConfigNotFoundError(filePath);
    }
    throw new ParseError(
      `Failed to read file: ${error.message}`,
      filePath
    );
  }
}

/**
 * Checks if a file exists.
 *
 * @param filePath - Path to file
 * @returns True if file exists
 *
 * @example
 * ```typescript
 * if (await exists('./config.yaml')) {
 *   // File exists
 * }
 * ```
 */
export async function exists(filePath: string): Promise<boolean> {
  try {
    await fsStat(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a path exists (sync version).
 *
 * @param path - Path to check
 * @returns True if path exists
 *
 * @example
 * ```typescript
 * if (pathExistsSync('./config')) {
 *   // Directory exists
 * }
 * ```
 */
export function pathExistsSync(path: string): boolean {
  return existsSync(path);
}

/**
 * Resolves multiple paths relative to a base directory.
 *
 * @param paths - Array of paths to resolve
 * @param cwd - Base directory (default: process.cwd())
 * @returns Resolved paths
 *
 * @example
 * ```typescript
 * resolvePaths(['./config.yaml', './config.local.yaml'], '/myapp')
 * // ['/myapp/config.yaml', '/myapp/config.local.yaml']
 * ```
 */
export function resolvePaths(paths: string[], cwd = process.cwd()): string[] {
  return paths.map(path => resolve(cwd, path));
}

/**
 * Finds configuration files for a given application and environment.
 *
 * @param name - Application name
 * @param cwd - Base directory to search in
 * @param env - Current environment
 * @param extensions - File extensions to look for
 * @returns Array of found config file paths
 *
 * @example
 * ```typescript
 * findConfigFiles('myapp', process.cwd(), 'development', ['.yaml', '.yml', '.json'])
 * // ['./config.yaml', './config.development.yaml', './config.local.yaml']
 * ```
 */
export function findConfigFiles(
  name: string,
  cwd: string,
  env: string,
  extensions: string[] = ['.yaml', '.yml', '.json', '.toml', '.ini', '.env']
): string[] {
  const files: string[] = [];
  const baseName = `${name}.config`;
  const envName = `${name}.config.${env}`;
  const localName = `${name}.config.local`;

  // Try base config first
  for (const ext of extensions) {
    const filePath = resolve(cwd, `${baseName}${ext}`);
    if (existsSync(filePath)) {
      files.push(filePath);
    }
  }

  // Try environment-specific config
  for (const ext of extensions) {
    const filePath = resolve(cwd, `${envName}${ext}`);
    if (existsSync(filePath)) {
      files.push(filePath);
    }
  }

  // Try local config
  for (const ext of extensions) {
    const filePath = resolve(cwd, `${localName}${ext}`);
    if (existsSync(filePath)) {
      files.push(filePath);
    }
  }

  // Try environment variables (.env file)
  const envFilePath = resolve(cwd, '.env');
  if (existsSync(envFilePath)) {
    files.push(envFilePath);
  }

  // Try app-specific .env file
  const appEnvFilePath = resolve(cwd, `.env.${name}`);
  if (existsSync(appEnvFilePath)) {
    files.push(appEnvFilePath);
  }

  return files;
}

/**
 * Detects configuration format from file path or explicit format.
 *
 * @param filePath - Path to configuration file
 * @param explicitFormat - Explicitly specified format
 * @returns Detected format name
 *
 * @example
 * ```typescript
 * detectFormat('./config.yaml') // 'yaml'
 * detectFormat('./config.json') // 'json'
 * detectFormat('./config.yaml', 'json') // 'json' (explicit override)
 * ```
 */
export function detectFormat(
  filePath: string,
  explicitFormat?: string
): string {
  if (explicitFormat) {
    return explicitFormat.toLowerCase();
  }

  const ext = normalize(filePath).split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'yaml':
    case 'yml':
      return 'yaml';

    case 'toml':
      return 'toml';

    case 'ini':
      return 'ini';

    case 'env':
    case 'dotenv':
      return 'env';

    case 'json':
      return 'json';

    case 'js':
    case 'mjs':
      return 'javascript';

    case 'ts':
    case 'mts':
      return 'typescript';

    default:
      return 'json';
  }
}

/**
 * Watches a file for changes.
 *
 * @param filePath - Path to file
 * @param callback - Callback function for changes
 * @returns Watcher instance with close method
 *
 * @example
 * ```typescript
 * const watcher = await watchFile('./config.yaml', (event) => {
 *   console.log('File changed:', event);
 * });
 * // Later:
 * watcher.close();
 * ```
 */
export async function watchFile(
  filePath: string,
  callback: (event: { type: string; timestamp: number }) => void
): Promise<{ close: () => void }> {
  return new Promise((resolve, reject) => {
    try {
      const watcher = fsWatch(filePath, (eventType) => {
        callback({
          type: eventType,
          timestamp: Date.now(),
        });
      });

      resolve({
        close: () => {
          watcher.close();
        },
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Ensures a directory exists.
 *
 * @param dirPath - Directory path
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fsStat(dirPath);
  } catch {
    await fsStat(dirname(dirPath)).then(
      () => Promise.reject(new Error(`Parent directory does not exist: ${dirPath}`)),
      () => Promise.resolve()
    );
  }
}

/**
 * Gets file extension from path.
 *
 * @param filePath - File path
 * @returns File extension (without dot)
 *
 * @example
 * ```typescript
 * getExtension('./config.yaml') // 'yaml'
 * getExtension('./config') // ''
 * ```
 */
export function getExtension(filePath: string): string {
  const normalized = normalize(filePath);
  const parts = normalized.split('.');
  return parts.length > 1 && parts[parts.length - 1] ? parts[parts.length - 1]!.toLowerCase() : '';
}

/**
 * Checks if a path is absolute.
 *
 * @param path - Path to check
 * @returns True if path is absolute
 *
 * @example
 * ```typescript
 * isAbsolute('/home/user/config.yaml') // true
 * isAbsolute('./config.yaml') // false
 * ```
 */
export function isAbsolute(path: string): boolean {
  return normalize(path).startsWith('/') || /^[a-zA-Z]:\\/.test(normalize(path));
}

/**
 * Normalizes a path.
 *
 * @param path - Path to normalize
 * @returns Normalized path
 *
 * @example
 * ```typescript
 * normalize('./config/../config.yaml') // './config.yaml'
 * ```
 */
export function normalizePath(path: string): string {
  return normalize(path);
}

/**
 * Joins path segments.
 *
 * @param paths - Path segments to join
 * @returns Joined path
 *
 * @example
 * ```typescript
 * joinPaths(['config', 'database', 'config.yaml']) // 'config/database/config.yaml'
 * ```
 */
export function joinPaths(...paths: string[]): string {
  return join(...paths);
}

/**
 * Gets directory name from path.
 *
 * @param filePath - File path
 * @returns Directory name
 *
 * @example
 * ```typescript
 * dirname('./config/database/config.yaml') // './config/database'
 * ```
 */
export function getDirname(filePath: string): string {
  return dirname(filePath);
}
