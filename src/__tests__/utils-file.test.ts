// @ts-nocheck
/**
 * Tests for utils/file.ts
 */

import { jest } from '@jest/globals';
import {
  readFile,
  exists,
  pathExistsSync,
  resolvePaths,
  findConfigFiles,
  detectFormat,
  watchFile,
  ensureDir,
  getExtension,
  isAbsolute,
  normalizePath,
  joinPaths,
  getDirname,
} from '../utils/file.js';
import { ConfigNotFoundError, ParseError } from '../errors.js';

// Mock fs modules
jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
  stat: jest.fn(),
}));

jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
  watch: jest.fn(),
}));

import { readFile as fsReadFile, stat as fsStat } from 'node:fs/promises';
import { existsSync, watch as fsWatch } from 'node:fs';

const mockedReadFile = fsReadFile as jest.MockedFunction<typeof fsReadFile>;
const mockedStat = fsStat as jest.MockedFunction<typeof fsStat>;
const mockedExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockedWatch = fsWatch as jest.MockedFunction<typeof fsWatch>;

describe('readFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should read file content successfully', async () => {
    const content = 'file content';
    mockedReadFile.mockResolvedValueOnce(content as any);

    const result = await readFile('/path/to/file.txt');
    expect(result).toBe(content);
    expect(mockedReadFile).toHaveBeenCalledWith('/path/to/file.txt', 'utf-8');
  });

  it('should throw ConfigNotFoundError for ENOENT error', async () => {
    const error = { code: 'ENOENT' } as any;
    mockedReadFile.mockRejectedValueOnce(error);

    await expect(readFile('/nonexistent/file.txt')).rejects.toThrow(ConfigNotFoundError);

    // Need to set up mock again for second call
    mockedReadFile.mockRejectedValueOnce(error);
    await expect(readFile('/nonexistent/file.txt')).rejects.toMatchObject({
      code: 'CONFIG_NOT_FOUND',
    });
  });

  it('should throw ParseError for other errors', async () => {
    const error = { code: 'EACCES', message: 'Permission denied' } as any;
    mockedReadFile.mockRejectedValueOnce(error);

    await expect(readFile('/path/to/file.txt')).rejects.toThrow(ParseError);
  });

  it('should handle empty file', async () => {
    mockedReadFile.mockResolvedValueOnce('' as any);

    const result = await readFile('/empty/file.txt');
    expect(result).toBe('');
  });

  it('should handle file with special characters', async () => {
    const content = 'Special chars: \n\t\r';
    mockedReadFile.mockResolvedValueOnce(content as any);

    const result = await readFile('/special/file.txt');
    expect(result).toBe(content);
  });

  it('should handle unicode content', async () => {
    const content = 'Hello 世界 🌍';
    mockedReadFile.mockResolvedValueOnce(content as any);

    const result = await readFile('/unicode/file.txt');
    expect(result).toBe(content);
  });
});

describe('exists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when file exists', async () => {
    mockedStat.mockResolvedValueOnce({} as any);

    const result = await exists('/existing/file.txt');
    expect(result).toBe(true);
    expect(mockedStat).toHaveBeenCalledWith('/existing/file.txt');
  });

  it('should return false when file does not exist', async () => {
    mockedStat.mockRejectedValueOnce({ code: 'ENOENT' } as any);

    const result = await exists('/nonexistent/file.txt');
    expect(result).toBe(false);
  });

  it('should return false for other errors', async () => {
    mockedStat.mockRejectedValueOnce(new Error('Some error'));

    const result = await exists('/error/file.txt');
    expect(result).toBe(false);
  });
});

describe('pathExistsSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when path exists', () => {
    mockedExistsSync.mockReturnValueOnce(true);

    const result = pathExistsSync('/existing/path');
    expect(result).toBe(true);
    expect(mockedExistsSync).toHaveBeenCalledWith('/existing/path');
  });

  it('should return false when path does not exist', () => {
    mockedExistsSync.mockReturnValueOnce(false);

    const result = pathExistsSync('/nonexistent/path');
    expect(result).toBe(false);
  });
});

describe('resolvePaths', () => {
  it('should resolve single path relative to cwd', () => {
    const result = resolvePaths(['./config.yaml'], '/base');
    // On Windows, path becomes D:\base\config.yaml, so check for filename
    expect(result[0]).toContain('config.yaml');
    expect(result[0]).toMatch(/base[\\\/]config\.yaml$/);
  });

  it('should resolve multiple paths', () => {
    const result = resolvePaths(['./a.yaml', './b.json'], '/base');
    expect(result[0]).toMatch(/base[\\\/]a\.yaml$/);
    expect(result[1]).toMatch(/base[\\\/]b\.json$/);
  });

  it('should use process.cwd() as default base', () => {
    const result = resolvePaths(['./config.yaml']);
    expect(result[0]).toContain('config.yaml');
  });

  it('should handle absolute paths', () => {
    const result = resolvePaths(['/absolute/path/config.yaml'], '/base');
    // Path is absolute, should contain config.yaml
    expect(result[0]).toContain('config.yaml');
  });

  it('should handle relative paths with ..', () => {
    const result = resolvePaths(['../config.yaml'], '/base/dir');
    // Result should have base in path (parent of dir)
    expect(result[0]).toContain('config.yaml');
    expect(result[0]).toMatch(/base[\\\/]config\.yaml$/);
  });

  it('should handle empty array', () => {
    const result = resolvePaths([]);
    expect(result).toEqual([]);
  });
});

describe('findConfigFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find base config file', () => {
    mockedExistsSync.mockImplementation((path) => {
      return (path as string).endsWith('myapp.config.yaml');
    });

    const result = findConfigFiles('myapp', '/cwd', 'development');
    // Check that result contains a path ending with the expected filename (cross-platform)
    expect(result.some(p => p.endsWith('myapp.config.yaml'))).toBe(true);
  });

  it('should find environment-specific config file', () => {
    mockedExistsSync.mockImplementation((path) => {
      const str = path as string;
      return str.endsWith('myapp.config.development.yaml');
    });

    const result = findConfigFiles('myapp', '/cwd', 'development');
    expect(result.some(p => p.endsWith('myapp.config.development.yaml'))).toBe(true);
  });

  it('should find local config file', () => {
    mockedExistsSync.mockImplementation((path) => {
      return (path as string).endsWith('myapp.config.local.yaml');
    });

    const result = findConfigFiles('myapp', '/cwd', 'development');
    expect(result.some(p => p.endsWith('myapp.config.local.yaml'))).toBe(true);
  });

  it('should find .env file', () => {
    mockedExistsSync.mockImplementation((path) => {
      return (path as string).endsWith('.env');
    });

    const result = findConfigFiles('myapp', '/cwd', 'development');
    expect(result.some(p => p.endsWith('.env'))).toBe(true);
  });

  it('should find app-specific .env file', () => {
    mockedExistsSync.mockImplementation((path) => {
      return (path as string).endsWith('.env.myapp');
    });

    const result = findConfigFiles('myapp', '/cwd', 'development');
    expect(result.some(p => p.endsWith('.env.myapp'))).toBe(true);
  });

  it('should find multiple config files', () => {
    mockedExistsSync.mockImplementation((path) => {
      const str = path as string;
      return str.endsWith('.yaml') || str.endsWith('.env');
    });

    const result = findConfigFiles('myapp', '/cwd', 'development');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should respect custom extensions', () => {
    mockedExistsSync.mockImplementation((path) => {
      return (path as string).endsWith('.custom');
    });

    const result = findConfigFiles('myapp', '/cwd', 'development', ['.custom']);
    expect(result.some(p => p.endsWith('myapp.config.custom'))).toBe(true);
  });

  it('should return empty array when no files found', () => {
    mockedExistsSync.mockReturnValue(false);

    const result = findConfigFiles('myapp', '/cwd', 'development');
    expect(result).toEqual([]);
  });

  it('should search in correct order', () => {
    const calls: string[] = [];
    mockedExistsSync.mockImplementation((path) => {
      calls.push(path as string);
      return false;
    });

    findConfigFiles('myapp', '/cwd', 'production');
    expect(calls[0]).toContain('myapp.config.yaml');
  });
});

describe('detectFormat', () => {
  it('should detect yaml format', () => {
    expect(detectFormat('config.yaml')).toBe('yaml');
    expect(detectFormat('config.YAML')).toBe('yaml');
    expect(detectFormat('config.yml')).toBe('yaml'); // yml normalizes to yaml
    expect(detectFormat('config.YML')).toBe('yaml'); // YML normalizes to yaml
  });

  it('should detect toml format', () => {
    expect(detectFormat('config.toml')).toBe('toml');
    expect(detectFormat('config.TOML')).toBe('toml');
  });

  it('should detect ini format', () => {
    expect(detectFormat('config.ini')).toBe('ini');
    expect(detectFormat('config.INI')).toBe('ini');
  });

  it('should detect env format', () => {
    expect(detectFormat('.env')).toBe('env');
    expect(detectFormat('.ENV')).toBe('env');
    expect(detectFormat('config.env')).toBe('env');
    expect(detectFormat('config.dotenv')).toBe('env'); // dotenv extension maps to 'env' format
  });

  it('should detect json format', () => {
    expect(detectFormat('config.json')).toBe('json');
    expect(detectFormat('config.JSON')).toBe('json');
  });

  it('should detect javascript format', () => {
    expect(detectFormat('config.js')).toBe('javascript');
    expect(detectFormat('config.mjs')).toBe('javascript');
  });

  it('should detect typescript format', () => {
    expect(detectFormat('config.ts')).toBe('typescript');
    expect(detectFormat('config.mts')).toBe('typescript');
  });

  it('should default to json for unknown formats', () => {
    expect(detectFormat('config.unknown')).toBe('json');
    expect(detectFormat('config')).toBe('json');
    expect(detectFormat('config.txt')).toBe('json');
  });

  it('should use explicit format when provided', () => {
    expect(detectFormat('config.txt', 'yaml')).toBe('yaml');
    expect(detectFormat('file.json', 'toml')).toBe('toml');
  });

  it('should lowercase explicit format', () => {
    expect(detectFormat('config.txt', 'YAML')).toBe('yaml');
    expect(detectFormat('config.txt', 'JSON')).toBe('json');
  });

  it('should handle complex file paths', () => {
    expect(detectFormat('./config/app.config.yaml')).toBe('yaml');
    expect(detectFormat('/absolute/path/to/config.json')).toBe('json');
  });

  it('should handle multiple extensions', () => {
    // gz is not a config format, so defaults to json
    expect(detectFormat('config.tar.gz')).toBe('json');
    // But yaml is a config format
    expect(detectFormat('config.backup.yaml')).toBe('yaml');
  });

  it('should handle files with query parameters', () => {
    expect(detectFormat('config.yaml?v=1')).toBe('yaml');
  });
});

describe('watchFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should watch file for changes', async () => {
    let watchCallback: ((eventType: string) => void) | undefined;
    mockedWatch.mockImplementation((path, callback) => {
      watchCallback = callback as any;
      return {} as any;
    });

    const callback = jest.fn();
    const watcher = await watchFile('/path/to/file.txt', callback);

    expect(mockedWatch).toHaveBeenCalledWith('/path/to/file.txt', expect.any(Function));
    expect(watcher).toBeDefined();
    expect(watcher.close).toBeInstanceOf(Function);

    // Simulate file change
    if (watchCallback) {
      watchCallback('change');
    }

    expect(callback).toHaveBeenCalledWith({
      type: 'change',
      timestamp: expect.any(Number),
    });
  });

  it('should return watcher with close method', async () => {
    const mockWatcher = { close: jest.fn() };
    mockedWatch.mockReturnValue(mockWatcher as any);

    const watcher = await watchFile('/path/to/file.txt', () => {});

    expect(watcher.close).toBeInstanceOf(Function);
    watcher.close();
    expect(mockWatcher.close).toHaveBeenCalled();
  });

  it('should handle reject on error', async () => {
    mockedWatch.mockImplementation(() => {
      throw new Error('Watch failed');
    });

    await expect(watchFile('/path/to/file.txt', () => {})).rejects.toThrow('Watch failed');
  });

  it('should handle rename event', async () => {
    let watchCallback: ((eventType: string) => void) | undefined;
    mockedWatch.mockImplementation((path, callback) => {
      watchCallback = callback as any;
      return {} as any;
    });

    const callback = jest.fn();
    await watchFile('/path/to/file.txt', callback);

    if (watchCallback) {
      watchCallback('rename');
    }

    expect(callback).toHaveBeenCalledWith({
      type: 'rename',
      timestamp: expect.any(Number),
    });
  });
});

describe('ensureDir', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should pass when directory exists', async () => {
    mockedStat.mockResolvedValueOnce({ isDirectory: () => true } as any);

    await expect(ensureDir('/existing/dir')).resolves.toBeUndefined();
  });

  it('should reject when parent directory does not exist', async () => {
    mockedStat
      .mockRejectedValueOnce({ code: 'ENOENT' } as any)
      .mockRejectedValueOnce({ code: 'ENOENT' } as any);

    await expect(ensureDir('/nonexistent/parent/dir')).rejects.toThrow();
  });
});

describe('getExtension', () => {
  it('should get extension from simple file path', () => {
    expect(getExtension('config.yaml')).toBe('yaml');
    expect(getExtension('file.json')).toBe('json');
  });

  it('should get extension from complex path', () => {
    expect(getExtension('./path/to/config.yaml')).toBe('yaml');
    expect(getExtension('/absolute/path/file.txt')).toBe('txt');
  });

  it('should return empty string for files without extension', () => {
    expect(getExtension('config')).toBe('');
    expect(getExtension('path/to/file')).toBe('');
  });

  it('should return last extension for multiple dots', () => {
    expect(getExtension('archive.tar.gz')).toBe('gz');
    expect(getExtension('file.name.with.dots.txt')).toBe('txt');
  });

  it('should lowercase extension', () => {
    expect(getExtension('config.YAML')).toBe('yaml');
    expect(getExtension('file.JSON')).toBe('json');
  });

  it('should handle empty string', () => {
    expect(getExtension('')).toBe('');
  });

  it('should handle paths ending with dot', () => {
    expect(getExtension('file.')).toBe('');
  });
});

describe('isAbsolute', () => {
  it('should return true for Unix absolute paths', () => {
    expect(isAbsolute('/path/to/file')).toBe(true);
    expect(isAbsolute('/')).toBe(true);
  });

  it('should return true for Windows absolute paths', () => {
    expect(isAbsolute('C:\\path\\to\\file')).toBe(true);
    expect(isAbsolute('D:/path/to/file')).toBe(true);
  });

  it('should return false for relative paths', () => {
    expect(isAbsolute('./path/to/file')).toBe(false);
    expect(isAbsolute('../path/to/file')).toBe(false);
    expect(isAbsolute('path/to/file')).toBe(false);
  });

  it('should handle mixed case drive letters', () => {
    expect(isAbsolute('c:\\path')).toBe(true);
    expect(isAbsolute('Z:\\path')).toBe(true);
  });
});

describe('normalizePath', () => {
  it('should normalize paths with ..', () => {
    expect(normalizePath('./config/../file.yaml')).toContain('file.yaml');
  });

  it('should normalize paths with .', () => {
    expect(normalizePath('./config/file.yaml')).toContain('config');
  });

  it('should handle multiple slashes', () => {
    expect(normalizePath('path//to///file')).not.toContain('//');
  });
});

describe('joinPaths', () => {
  it('should join path segments', () => {
    expect(joinPaths('config', 'database', 'config.yaml')).toContain('config');
    expect(joinPaths('a', 'b', 'c')).toBeDefined();
  });

  it('should handle empty segments', () => {
    expect(joinPaths()).toBeDefined();
  });

  it('should handle absolute paths in segments', () => {
    expect(joinPaths('/base', 'relative')).toBeDefined();
  });
});

describe('getDirname', () => {
  it('should get directory name from file path', () => {
    expect(getDirname('./config/database/config.yaml')).toContain('database');
  });

  it('should get parent directory for directory path', () => {
    expect(getDirname('./config/database')).toContain('config');
  });

  it('should return . for files in current directory', () => {
    expect(getDirname('file.yaml')).toBe('.');
  });

  it('should handle absolute paths', () => {
    expect(getDirname('/path/to/file.yaml')).toContain('path');
  });
});
