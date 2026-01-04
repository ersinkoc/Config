/**
 * Tests for file utilities.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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
} from '../../../src/utils/file.js';
import { ConfigNotFoundError, ParseError } from '../../../src/errors.js';
import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';

// Mock fs modules
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  stat: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  watch: vi.fn(),
}));

describe('readFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should read file content', async () => {
    (fs.readFile as ReturnType<typeof vi.fn>).mockResolvedValue('file content');

    const result = await readFile('/path/to/file.txt');
    expect(result).toBe('file content');
  });

  it('should throw ConfigNotFoundError for ENOENT', async () => {
    const error = new Error('ENOENT');
    (error as any).code = 'ENOENT';
    (fs.readFile as ReturnType<typeof vi.fn>).mockRejectedValue(error);

    await expect(readFile('/missing/file.txt')).rejects.toThrow(ConfigNotFoundError);
  });

  it('should throw ParseError for other errors', async () => {
    const error = new Error('Permission denied');
    (fs.readFile as ReturnType<typeof vi.fn>).mockRejectedValue(error);

    await expect(readFile('/no/permission/file.txt')).rejects.toThrow(ParseError);
  });
});

describe('exists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true if file exists', async () => {
    (fs.stat as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await exists('/path/to/file.txt');
    expect(result).toBe(true);
  });

  it('should return false if file does not exist', async () => {
    (fs.stat as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('ENOENT'));

    const result = await exists('/missing/file.txt');
    expect(result).toBe(false);
  });
});

describe('pathExistsSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return result from existsSync', () => {
    (fsSync.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);

    expect(pathExistsSync('/path/to/file.txt')).toBe(true);
    expect(fsSync.existsSync).toHaveBeenCalledWith('/path/to/file.txt');
  });
});

describe('resolvePaths', () => {
  it('should resolve paths relative to cwd', () => {
    const result = resolvePaths(['./config.yaml'], '/base');
    expect(result[0]).toContain('config.yaml');
  });

  it('should resolve multiple paths', () => {
    const result = resolvePaths(['./a.yaml', './b.yaml'], '/base');
    expect(result).toHaveLength(2);
  });

  it('should use process.cwd by default', () => {
    const result = resolvePaths(['./config.yaml']);
    expect(result).toHaveLength(1);
  });
});

describe('findConfigFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should find config files', () => {
    (fsSync.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const result = findConfigFiles('myapp', '/project', 'development');
    expect(result).toEqual([]);
  });

  it('should find existing files', () => {
    (fsSync.existsSync as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      return path.includes('myapp.config.yaml');
    });

    const result = findConfigFiles('myapp', '/project', 'development');
    expect(result.some((f) => f.includes('myapp.config'))).toBe(true);
  });

  it('should find environment-specific files', () => {
    (fsSync.existsSync as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      return path.includes('myapp.config.development');
    });

    const result = findConfigFiles('myapp', '/project', 'development');
    expect(result.some((f) => f.includes('development'))).toBe(true);
  });

  it('should find local config files', () => {
    (fsSync.existsSync as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      return path.includes('myapp.config.local');
    });

    const result = findConfigFiles('myapp', '/project', 'development');
    expect(result.some((f) => f.includes('local'))).toBe(true);
  });

  it('should find .env files', () => {
    (fsSync.existsSync as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      return path.endsWith('.env');
    });

    const result = findConfigFiles('myapp', '/project', 'development');
    expect(result.some((f) => f.endsWith('.env'))).toBe(true);
  });

  it('should find app-specific .env files', () => {
    (fsSync.existsSync as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      return path.includes('.env.myapp');
    });

    const result = findConfigFiles('myapp', '/project', 'development');
    expect(result.some((f) => f.includes('.env.myapp'))).toBe(true);
  });
});

describe('detectFormat', () => {
  it('should detect yaml format', () => {
    expect(detectFormat('./config.yaml')).toBe('yaml');
    expect(detectFormat('./config.yml')).toBe('yaml');
  });

  it('should detect toml format', () => {
    expect(detectFormat('./config.toml')).toBe('toml');
  });

  it('should detect ini format', () => {
    expect(detectFormat('./config.ini')).toBe('ini');
  });

  it('should detect env format', () => {
    expect(detectFormat('./.env')).toBe('env');
    expect(detectFormat('./config.dotenv')).toBe('env');
  });

  it('should detect json format', () => {
    expect(detectFormat('./config.json')).toBe('json');
  });

  it('should detect javascript format', () => {
    expect(detectFormat('./config.js')).toBe('javascript');
    expect(detectFormat('./config.mjs')).toBe('javascript');
  });

  it('should detect typescript format', () => {
    expect(detectFormat('./config.ts')).toBe('typescript');
    expect(detectFormat('./config.mts')).toBe('typescript');
  });

  it('should use explicit format', () => {
    expect(detectFormat('./config.yaml', 'json')).toBe('json');
    expect(detectFormat('./config.yaml', 'JSON')).toBe('json');
  });

  it('should default to json for unknown extensions', () => {
    expect(detectFormat('./config.unknown')).toBe('json');
    expect(detectFormat('./config')).toBe('json');
  });
});

describe('watchFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create watcher', async () => {
    const mockWatcher = { close: vi.fn() };
    (fsSync.watch as ReturnType<typeof vi.fn>).mockReturnValue(mockWatcher);

    const result = await watchFile('/path/to/file.txt', vi.fn());
    expect(result.close).toBeDefined();
  });

  it('should call callback on change', async () => {
    let watchCallback: any;
    (fsSync.watch as ReturnType<typeof vi.fn>).mockImplementation((path, cb) => {
      watchCallback = cb;
      return { close: vi.fn() };
    });

    const callback = vi.fn();
    await watchFile('/path/to/file.txt', callback);

    watchCallback('change');
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'change' })
    );
  });

  it('should close watcher', async () => {
    const mockClose = vi.fn();
    (fsSync.watch as ReturnType<typeof vi.fn>).mockReturnValue({ close: mockClose });

    const result = await watchFile('/path/to/file.txt', vi.fn());
    result.close();

    expect(mockClose).toHaveBeenCalled();
  });
});

describe('ensureDir', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not throw if directory exists', async () => {
    (fs.stat as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await expect(ensureDir('/existing/dir')).resolves.not.toThrow();
  });
});

describe('getExtension', () => {
  it('should get file extension', () => {
    expect(getExtension('./config.yaml')).toBe('yaml');
    expect(getExtension('./config.json')).toBe('json');
  });

  it('should handle multiple dots', () => {
    expect(getExtension('./config.local.yaml')).toBe('yaml');
  });

  it('should return empty string for no extension', () => {
    expect(getExtension('./config')).toBe('');
  });

  it('should return lowercase', () => {
    expect(getExtension('./config.YAML')).toBe('yaml');
  });
});

describe('isAbsolute', () => {
  it('should detect platform-specific absolute paths', () => {
    // On Windows, Unix paths like /home/user are not absolute
    // On Unix, Windows paths like C:\\ are not absolute
    // The function uses path.normalize which converts paths to platform format
    if (process.platform === 'win32') {
      expect(isAbsolute('C:\\Users\\config.yaml')).toBe(true);
      expect(isAbsolute('D:\\path\\file.txt')).toBe(true);
      // Unix paths are not absolute on Windows
      expect(isAbsolute('/home/user/config.yaml')).toBe(false);
    } else {
      expect(isAbsolute('/home/user/config.yaml')).toBe(true);
    }
  });

  it('should detect relative paths', () => {
    expect(isAbsolute('./config.yaml')).toBe(false);
    expect(isAbsolute('../config.yaml')).toBe(false);
    expect(isAbsolute('config.yaml')).toBe(false);
  });
});

describe('normalizePath', () => {
  it('should normalize path', () => {
    const result = normalizePath('./config/../config.yaml');
    expect(result).toBe('config.yaml');
  });
});

describe('joinPaths', () => {
  it('should join path segments', () => {
    const result = joinPaths('config', 'database', 'config.yaml');
    expect(result).toContain('config');
    expect(result).toContain('database');
    expect(result).toContain('config.yaml');
  });
});

describe('getDirname', () => {
  it('should get directory name', () => {
    const result = getDirname('/path/to/config.yaml');
    expect(result).toContain('path');
    expect(result).toContain('to');
    expect(result).not.toContain('config.yaml');
  });
});
