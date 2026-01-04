/**
 * Basic integration test for loadConfig
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadConfig, createConfig } from '../../src/index.js';

// Mock fs module
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  stat: vi.fn(),
}));

describe('loadConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create config programmatically', async () => {
    const config = createConfig({
      port: 3000,
      host: 'localhost',
      database: {
        host: 'localhost',
        port: 5432,
      },
    });

    expect(config.get('port')).toBe(3000);
    expect(config.get('host')).toBe('localhost');
    expect(config.get('database.host')).toBe('localhost');
    expect(config.get('database.port')).toBe(5432);
  });

  it('should support get with default values', async () => {
    const config = createConfig({
      port: 3000,
    });

    expect(config.get('port')).toBe(3000);
    expect(config.get('missing', 'default')).toBe('default');
    expect(config.get('alsoMissing')).toBeUndefined();
  });

  it('should support set and has', async () => {
    const config = createConfig({
      port: 3000,
    });

    expect(config.has('port')).toBe(true);
    expect(config.has('missing')).toBe(false);

    config.set('port', 4000);
    expect(config.get('port')).toBe(4000);

    config.set('newField', 'value');
    expect(config.has('newField')).toBe(true);
    expect(config.get('newField')).toBe('value');
  });

  it('should support delete', async () => {
    const config = createConfig({
      port: 3000,
      host: 'localhost',
    });

    expect(config.has('port')).toBe(true);

    const deleted = config.delete('port');
    expect(deleted).toBe(true);
    expect(config.has('port')).toBe(false);

    // Delete non-existent field
    const deleted2 = config.delete('missing');
    expect(deleted2).toBe(false);
  });

  it('should convert to object and JSON', async () => {
    const config = createConfig({
      port: 3000,
      host: 'localhost',
    });

    const obj = config.toObject();
    expect(obj).toEqual({
      port: 3000,
      host: 'localhost',
    });

    const json = config.toJSON();
    expect(JSON.parse(json)).toEqual({
      port: 3000,
      host: 'localhost',
    });
  });

  it('should support plugins', async () => {
    const config = createConfig({
      port: 3000,
    });

    const testPlugin = {
      name: 'test-plugin',
      version: '1.0.0',
      install: vi.fn(),
    };

    config.use(testPlugin);

    expect(config.plugins()).toContain('test-plugin');
    expect(testPlugin.install).toHaveBeenCalled();
  });
});
