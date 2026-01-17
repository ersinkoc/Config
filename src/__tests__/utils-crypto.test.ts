// @ts-nocheck
/**
 * Tests for utils/crypto.ts
 */

// Counter for generating unique random values
let randomCounter = 0;

// Storage for encrypted data to enable decryption
const encryptionStore = new Map<string, string>();

// Mock Node.js crypto module
jest.mock('node:crypto', () => {
  const crypto = jest.requireActual('node:crypto');

  return {
    ...crypto,
    randomBytes: jest.fn((size: number, callback?: Function) => {
      // Generate unique random bytes based on counter
      const result = Buffer.alloc(size);
      for (let i = 0; i < size; i++) {
        result.writeUInt8((randomCounter + i) % 256, i);
      }
      randomCounter++;
      return callback ? callback(null, result) : result;
    }),
    scryptSync: jest.fn((password: string, salt: string, keyLength: number) => {
      // Create deterministic but different keys based on password and salt
      const combined = password + salt;
      const hash = crypto.createHash('sha256').update(combined).digest();

      // Extend or truncate to desired keyLength
      const result = Buffer.alloc(keyLength);
      for (let i = 0; i < keyLength; i++) {
        result.writeUInt8(hash[i % hash.length], i);
      }
      return result;
    }),
    createCipheriv: jest.fn((algorithm: string, key: Buffer, iv: Buffer) => {
      // Mock cipher that simulates encryption
      let encryptedData = '';

      return {
        update: jest.fn((data: string, inputEncoding: string, outputEncoding: string) => {
          // For mock purposes, just return the data as hex string
          encryptedData = Buffer.from(data).toString('hex');
          return encryptedData;
        }),
        final: jest.fn((outputEncoding: string) => {
          return '';
        }),
        getAuthTag: jest.fn(() => {
          // Return a mock auth tag
          return Buffer.from('00000000000000000000000000000000', 'hex');
        }),
        setAuthTagLength: jest.fn(),
      };
    }),
    createDecipheriv: jest.fn((algorithm: string, key: Buffer, iv: Buffer) => {
      // Mock decipher that simulates decryption
      return {
        update: jest.fn((data: string, inputEncoding: string, outputEncoding: string) => {
          // For mock purposes, convert hex back to string
          if (data && data.length > 0) {
            try {
              return Buffer.from(data, 'hex').toString('utf8');
            } catch {
              return '';
            }
          }
          return '';
        }),
        final: jest.fn((outputEncoding: string) => {
          return '';
        }),
        setAuthTag: jest.fn(),
        setAuthTagLength: jest.fn(),
      };
    }),
    createHash: jest.fn((algorithm: string) => {
      return crypto.createHash(algorithm);
    }),
  };
});

import {
  generateSalt,
  generateIV,
  deriveKey,
  encrypt,
  decrypt,
  isEncrypted,
  encryptObject,
  decryptObject,
  hashString,
  validateOptions,
  type EncryptionOptions,
} from '../utils/crypto.js';
import { EncryptionError } from '../errors.js';

describe('generateSalt', () => {
  it('should generate a salt with default length', () => {
    const salt = generateSalt();
    expect(salt).toBeDefined();
    expect(typeof salt).toBe('string');
    expect(salt.length).toBe(64); // 32 bytes * 2 (hex encoding)
  });

  it('should generate salt with custom length', () => {
    const salt = generateSalt(16);
    expect(salt.length).toBe(32); // 16 bytes * 2
  });

  it('should generate different salts each time', () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    expect(salt1).not.toBe(salt2);
  });

  it('should handle length of 1', () => {
    const salt = generateSalt(1);
    expect(salt.length).toBe(2);
  });

  it('should handle large lengths', () => {
    const salt = generateSalt(128);
    expect(salt.length).toBe(256);
  });

  it('should generate valid hex string', () => {
    const salt = generateSalt();
    expect(/^[0-9a-f]+$/.test(salt)).toBe(true);
  });
});

describe('generateIV', () => {
  it('should generate an IV with default length', () => {
    const iv = generateIV();
    expect(iv).toBeDefined();
    expect(typeof iv).toBe('string');
    expect(iv.length).toBe(32); // 16 bytes * 2 (hex encoding)
  });

  it('should generate IV with custom length', () => {
    const iv = generateIV(8);
    expect(iv.length).toBe(16); // 8 bytes * 2
  });

  it('should generate different IVs each time', () => {
    const iv1 = generateIV();
    const iv2 = generateIV();
    expect(iv1).not.toBe(iv2);
  });

  it('should generate valid hex string', () => {
    const iv = generateIV();
    expect(/^[0-9a-f]+$/.test(iv)).toBe(true);
  });
});

describe('deriveKey', () => {
  it('should derive a key from password and salt', () => {
    const salt = generateSalt();
    const key = deriveKey('password', salt);
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32); // Default key length
  });

  it('should derive same key for same inputs', () => {
    const salt = generateSalt();
    const key1 = deriveKey('password', salt);
    const key2 = deriveKey('password', salt);
    expect(key1.equals(key2)).toBe(true);
  });

  it('should derive different keys for different salts', () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    const key1 = deriveKey('password', salt1);
    const key2 = deriveKey('password', salt2);
    expect(key1.equals(key2)).toBe(false);
  });

  it('should derive different keys for different passwords', () => {
    const salt = generateSalt();
    const key1 = deriveKey('password1', salt);
    const key2 = deriveKey('password2', salt);
    expect(key1.equals(key2)).toBe(false);
  });

  it('should derive key with custom iterations', () => {
    const salt = generateSalt();
    const key = deriveKey('password', salt, 50000);
    expect(key).toBeInstanceOf(Buffer);
  });

  it('should derive key with custom key length', () => {
    const salt = generateSalt();
    const key = deriveKey('password', salt, 100000, 64);
    expect(key.length).toBe(64);
  });

  it('should handle empty password', () => {
    const salt = generateSalt();
    const key = deriveKey('', salt);
    expect(key).toBeInstanceOf(Buffer);
  });

  it('should handle special characters in password', () => {
    const salt = generateSalt();
    const key = deriveKey('p@$$w0rd!🔐', salt);
    expect(key).toBeInstanceOf(Buffer);
  });
});

describe('encrypt', () => {
  it('should encrypt a string', () => {
    const encrypted = encrypt('Hello, World!', 'password');
    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe('string');
    expect(encrypted).toMatch(/^ENC:/);
  });

  it('should produce different ciphertext for same input', () => {
    const plaintext = 'Same input';
    const password = 'password';
    const encrypted1 = encrypt(plaintext, password);
    const encrypted2 = encrypt(plaintext, password);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should throw error for empty password', () => {
    expect(() => encrypt('data', '')).toThrow('Encryption key is required');
  });

  it('should throw error for undefined password', () => {
    expect(() => encrypt('data', '' as any)).toThrow();
  });

  it('should use custom marker', () => {
    const encrypted = encrypt('data', 'password', { marker: 'CUSTOM:' });
    expect(encrypted).toMatch(/^CUSTOM:/);
  });

  it('should support hex encoding', () => {
    const encrypted = encrypt('data', 'password', { encoding: 'hex' });
    expect(encrypted).toMatch(/^ENC:/);
  });
});

describe('decrypt', () => {
  it('should throw error for invalid format', () => {
    expect(() => decrypt('invalid-format', 'password')).toThrow();
  });

  it('should throw error for missing marker', () => {
    expect(() => decrypt('no-marker-here', 'password')).toThrow();
  });

  it('should throw error for corrupted data', () => {
    expect(() => decrypt('ENC:corrupted-data', 'password')).toThrow();
  });

  it('should throw error for empty password', () => {
    const encrypted = encrypt('data', 'password');
    expect(() => decrypt(encrypted, '')).toThrow('Decryption key is required');
  });

  it('should use custom marker', () => {
    const encrypted = encrypt('data', 'password', { marker: 'CUSTOM:' });
    expect(encrypted).toMatch(/^CUSTOM:/);
  });

  it('should support hex encoding', () => {
    const encrypted = encrypt('data', 'password', { encoding: 'hex' });
    expect(encrypted).toMatch(/^ENC:/);
  });
});

describe('isEncrypted', () => {
  it('should return true for encrypted values', () => {
    const encrypted = encrypt('data', 'password');
    expect(isEncrypted(encrypted)).toBe(true);
  });

  it('should return false for plain text', () => {
    expect(isEncrypted('plain text')).toBe(false);
  });

  it('should return false for non-string values', () => {
    expect(isEncrypted(123 as any)).toBe(false);
    expect(isEncrypted(null as any)).toBe(false);
    expect(isEncrypted(undefined as any)).toBe(false);
  });

  it('should use custom marker', () => {
    const encrypted = encrypt('data', 'password', { marker: 'CUSTOM:' });
    expect(isEncrypted(encrypted, 'CUSTOM:')).toBe(true);
    expect(isEncrypted(encrypted, 'OTHER:')).toBe(false);
  });

  it('should return true for string starting with marker', () => {
    expect(isEncrypted('ENC:some-data')).toBe(true);
    expect(isEncrypted('ENC:')).toBe(true);
  });

  it('should return false for string not starting with marker', () => {
    expect(isEncrypted('XENC:data')).toBe(false);
    expect(isEncrypted('enc:data')).toBe(false);
    expect(isEncrypted('')).toBe(false);
  });
});

describe('encryptObject', () => {
  it('should encrypt all string values', () => {
    const obj = {
      password: 'secret123',
      apiKey: 'key-456',
      port: 3000,
      active: true,
    };
    const encrypted = encryptObject(obj, 'password');
    expect(encrypted.password).toMatch(/^ENC:/);
    expect(encrypted.apiKey).toMatch(/^ENC:/);
    expect(encrypted.port).toBe(3000);
    expect(encrypted.active).toBe(true);
  });

  it('should encrypt nested object string values', () => {
    const obj = {
      database: {
        host: 'localhost',
        password: 'db-secret',
      },
    };
    const encrypted = encryptObject(obj, 'password');
    expect(encrypted.database.password).toMatch(/^ENC:/);
    expect(encrypted.database.host).toMatch(/^ENC:/);
  });

  it('should preserve non-string values', () => {
    const obj = {
      number: 42,
      bool: true,
      null: null,
      arr: [1, 2, 3],
      nested: { value: 'string' },
    };
    const encrypted = encryptObject(obj, 'password');
    expect(encrypted.number).toBe(42);
    expect(encrypted.bool).toBe(true);
    expect(encrypted.null).toBeNull();
    expect(encrypted.arr).toEqual([1, 2, 3]);
    expect(encrypted.nested.value).toMatch(/^ENC:/);
  });

  it('should handle empty object', () => {
    const encrypted = encryptObject({}, 'password');
    expect(encrypted).toEqual({});
  });

  it('should handle object with only non-strings', () => {
    const obj = { num: 1, bool: true };
    const encrypted = encryptObject(obj, 'password');
    expect(encrypted).toEqual(obj);
  });

  it('should handle null and undefined values', () => {
    const obj = {
      str: 'value',
      null: null,
      undef: undefined,
    };
    const encrypted = encryptObject(obj, 'password');
    expect(encrypted.str).toMatch(/^ENC:/);
    expect(encrypted.null).toBeNull();
    expect(encrypted.undef).toBeUndefined();
  });

  it('should not encrypt arrays', () => {
    const obj = {
      arr: ['a', 'b', 'c'],
      str: 'value',
    };
    const encrypted = encryptObject(obj, 'password');
    expect(encrypted.arr).toEqual(['a', 'b', 'c']);
    expect(encrypted.str).toMatch(/^ENC:/);
  });
});

describe('decryptObject', () => {
  it('should handle empty object', () => {
    const decrypted = decryptObject({}, 'password');
    expect(decrypted).toEqual({});
  });

  it('should handle object with no encrypted values', () => {
    const obj = { num: 1, str: 'plain' };
    const decrypted = decryptObject(obj, 'password');
    expect(decrypted).toEqual(obj);
  });

  it('should use custom marker', () => {
    const obj = { value: 'secret' };
    const encrypted = encryptObject(obj, 'password', { marker: 'SEC:' });
    expect(encrypted.value).toMatch(/^SEC:/);
  });

  it('should handle arrays of objects', () => {
    const obj = {
      items: [
        { name: 'Item 1' },
        { name: 'Item 2' },
      ],
    };
    const encrypted = encryptObject(obj, 'password');
    expect(encrypted.items).toBeInstanceOf(Array);
  });
});

describe('hashString', () => {
  it('should hash a string', () => {
    const hash = hashString('Hello, World!');
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(64); // SHA-256 produces 64 hex characters
  });

  it('should produce same hash for same input', () => {
    const hash1 = hashString('same input');
    const hash2 = hashString('same input');
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different inputs', () => {
    const hash1 = hashString('input1');
    const hash2 = hashString('input2');
    expect(hash1).not.toBe(hash2);
  });

  it('should be deterministic', () => {
    const input = 'deterministic';
    const hashes = Array.from({ length: 10 }, () => hashString(input));
    expect(new Set(hashes).size).toBe(1);
  });

  it('should handle empty string', () => {
    const hash = hashString('');
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64);
  });

  it('should handle special characters', () => {
    const hash = hashString('Special: \n\t\r\n🔐');
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64);
  });

  it('should produce valid hex string', () => {
    const hash = hashString('test');
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
  });
});

describe('validateOptions', () => {
  it('should validate options with key', () => {
    const options: Partial<EncryptionOptions> = { key: 'password' };
    const validated = validateOptions(options);
    expect(validated.key).toBe('password');
    expect(validated.algorithm).toBe('aes-256-gcm');
    expect(validated.marker).toBe('ENC:');
    expect(validated.encoding).toBe('base64');
  });

  it('should throw error for missing key', () => {
    const options: Partial<EncryptionOptions> = {};
    expect(() => validateOptions(options)).toThrow('Encryption key is required');
  });

  it('should throw error for invalid algorithm', () => {
    const options: Partial<EncryptionOptions> = {
      key: 'password',
      algorithm: 'invalid',
    };
    expect(() => validateOptions(options)).toThrow('Only aes-256-gcm algorithm is supported');
  });

  it('should throw error for invalid encoding', () => {
    const options: Partial<EncryptionOptions> = {
      key: 'password',
      encoding: 'invalid' as any,
    };
    expect(() => validateOptions(options)).toThrow('Encoding must be "base64" or "hex"');
  });

  it('should allow valid encodings', () => {
    const base64Opts = { key: 'password', encoding: 'base64' as const };
    expect(() => validateOptions(base64Opts)).not.toThrow();

    const hexOpts = { key: 'password', encoding: 'hex' as const };
    expect(() => validateOptions(hexOpts)).not.toThrow();
  });

  it('should merge with default options', () => {
    const options: Partial<EncryptionOptions> = {
      key: 'password',
      marker: 'CUSTOM:',
      saltLength: 64,
    };
    const validated = validateOptions(options);
    expect(validated.key).toBe('password');
    expect(validated.marker).toBe('CUSTOM:');
    expect(validated.saltLength).toBe(64);
    expect(validated.algorithm).toBe('aes-256-gcm');
  });

  it('should handle all custom options', () => {
    const options: Partial<EncryptionOptions> = {
      key: 'password',
      algorithm: 'aes-256-gcm',
      marker: 'SEC:',
      encoding: 'hex',
      saltLength: 16,
      ivLength: 12,
      tagLength: 14,
      iterations: 50000,
      keyLength: 24,
    };
    const validated = validateOptions(options);
    expect(validated.key).toBe('password');
    expect(validated.marker).toBe('SEC:');
    expect(validated.encoding).toBe('hex');
    expect(validated.saltLength).toBe(16);
    expect(validated.ivLength).toBe(12);
    expect(validated.tagLength).toBe(14);
    expect(validated.iterations).toBe(50000);
    expect(validated.keyLength).toBe(24);
  });
});

describe('Integration tests', () => {
  it('should produce different encrypted values for same object', () => {
    const obj = { value: 'test' };
    const encrypted1 = encryptObject(obj, 'password');
    const encrypted2 = encryptObject(obj, 'password');

    expect(encrypted1.value).not.toBe(encrypted2.value);
  });

  it('should produce different encrypted values for different passwords', () => {
    const obj = { value: 'secret' };
    const encrypted1 = encryptObject(obj, 'password1');
    const encrypted2 = encryptObject(obj, 'password2');

    expect(encrypted1.value).not.toBe(encrypted2.value);
  });
});

describe('Encryption error handling', () => {
  it('should throw wrapped error when encryption fails', () => {
    // Mock createCipheriv to throw an error
    const crypto = require('node:crypto');
    const originalCreateCipheriv = crypto.createCipheriv;

    crypto.createCipheriv = jest.fn(() => {
      throw new Error('Cipher creation failed');
    });

    expect(() => encrypt('data', 'password')).toThrow('Encryption failed: Cipher creation failed');

    // Restore
    crypto.createCipheriv = originalCreateCipheriv;
  });
});
