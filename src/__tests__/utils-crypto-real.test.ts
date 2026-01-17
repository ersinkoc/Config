// @ts-nocheck
/**
 * Real crypto tests without mocks - for testing actual encryption/decryption
 */

// Unmock crypto module to use real implementation
jest.unmock('node:crypto');

// Need to clear module cache and reimport
jest.resetModules();

// Import after unmocking
const crypto = require('../utils/crypto.js');
const { encrypt, decrypt, encryptObject, decryptObject, isEncrypted } = crypto;

describe('Real crypto round-trip tests', () => {
  const password = 'test-password-123';

  it('should encrypt and decrypt a string', () => {
    const plaintext = 'Hello, World!';

    const encrypted = encrypt(plaintext, password);
    expect(encrypted).toMatch(/^ENC:/);

    const decrypted = decrypt(encrypted, password);
    expect(decrypted).toBe(plaintext);
  });

  it('should encrypt and decrypt with hex encoding', () => {
    const plaintext = 'Test with hex encoding';
    const options = { encoding: 'hex' as const };

    const encrypted = encrypt(plaintext, password, options);
    expect(encrypted).toMatch(/^ENC:/);

    const decrypted = decrypt(encrypted, password, options);
    expect(decrypted).toBe(plaintext);
  });

  it('should encrypt and decrypt with custom marker', () => {
    const plaintext = 'Custom marker test';
    const options = { marker: 'SECRET:' };

    const encrypted = encrypt(plaintext, password, options);
    expect(encrypted).toMatch(/^SECRET:/);

    const decrypted = decrypt(encrypted, password, options);
    expect(decrypted).toBe(plaintext);
  });

  it('should encrypt and decrypt an object', () => {
    const obj = {
      username: 'admin',
      password: 'secret123',
      port: 3000,
      enabled: true,
    };

    const encrypted = encryptObject(obj, password);

    expect(encrypted.username).toMatch(/^ENC:/);
    expect(encrypted.password).toMatch(/^ENC:/);
    expect(encrypted.port).toBe(3000);
    expect(encrypted.enabled).toBe(true);

    const decrypted = decryptObject(encrypted, password);

    expect(decrypted.username).toBe('admin');
    expect(decrypted.password).toBe('secret123');
    expect(decrypted.port).toBe(3000);
    expect(decrypted.enabled).toBe(true);
  });

  it('should encrypt and decrypt nested objects', () => {
    const obj = {
      database: {
        host: 'localhost',
        credentials: {
          username: 'root',
          password: 'db-secret',
        },
      },
      api: {
        key: 'api-key-123',
      },
      port: 8080,
    };

    const encrypted = encryptObject(obj, password);

    // Verify encrypted values
    expect(encrypted.database.host).toMatch(/^ENC:/);
    expect(encrypted.database.credentials.username).toMatch(/^ENC:/);
    expect(encrypted.database.credentials.password).toMatch(/^ENC:/);
    expect(encrypted.api.key).toMatch(/^ENC:/);
    expect(encrypted.port).toBe(8080);

    // Decrypt and verify
    const decrypted = decryptObject(encrypted, password);

    expect(decrypted.database.host).toBe('localhost');
    expect(decrypted.database.credentials.username).toBe('root');
    expect(decrypted.database.credentials.password).toBe('db-secret');
    expect(decrypted.api.key).toBe('api-key-123');
    expect(decrypted.port).toBe(8080);
  });

  it('should fail decrypt with wrong password', () => {
    const plaintext = 'Secret message';
    const encrypted = encrypt(plaintext, password);

    expect(() => decrypt(encrypted, 'wrong-password')).toThrow('Decryption failed');
  });

  it('should handle empty string encryption', () => {
    const encrypted = encrypt('', password);
    const decrypted = decrypt(encrypted, password);
    expect(decrypted).toBe('');
  });

  it('should handle special characters', () => {
    const plaintext = 'Special chars: 日本語 🔐 αβγ \n\t\r';
    const encrypted = encrypt(plaintext, password);
    const decrypted = decrypt(encrypted, password);
    expect(decrypted).toBe(plaintext);
  });

  it('should handle long text', () => {
    const plaintext = 'A'.repeat(10000);
    const encrypted = encrypt(plaintext, password);
    const decrypted = decrypt(encrypted, password);
    expect(decrypted).toBe(plaintext);
  });

  it('should decrypt previously encrypted value correctly', () => {
    // Encrypt twice with same plaintext (should produce different ciphertext)
    const plaintext = 'Deterministic test';
    const encrypted1 = encrypt(plaintext, password);
    const encrypted2 = encrypt(plaintext, password);

    expect(encrypted1).not.toBe(encrypted2); // Random salt/iv

    // Both should decrypt to same value
    expect(decrypt(encrypted1, password)).toBe(plaintext);
    expect(decrypt(encrypted2, password)).toBe(plaintext);
  });
});
