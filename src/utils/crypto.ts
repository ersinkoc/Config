/**
 * Encryption utilities using Node.js crypto module.
 * Implements AES-256-GCM encryption with PBKDF2 key derivation.
 */

import {
  randomBytes,
  scryptSync,
  createCipheriv,
  createDecipheriv,
  createHash,
} from 'node:crypto';
import type { EncryptionError } from '../errors.js';

/**
 * Encryption options.
 */
export interface EncryptionOptions {
  /** Encryption key */
  key: string;

  /** Encryption algorithm (default: 'aes-256-gcm') */
  algorithm?: string;

  /** Encrypted value marker (default: 'ENC:') */
  marker?: string;

  /** Encoding for encrypted data (default: 'base64') */
  encoding?: 'base64' | 'hex';

  /** Salt length for PBKDF2 (default: 32) */
  saltLength?: number;

  /** IV length for AES (default: 16) */
  ivLength?: number;

  /** Tag length for GCM (default: 16) */
  tagLength?: number;

  /** PBKDF2 iterations (default: 100000) */
  iterations?: number;

  /** Key length for derived key (default: 32) */
  keyLength?: number;
}

/**
 * Default encryption options.
 */
const DEFAULT_OPTIONS: Required<EncryptionOptions> = {
  key: '',
  algorithm: 'aes-256-gcm',
  marker: 'ENC:',
  encoding: 'base64',
  saltLength: 32,
  ivLength: 16,
  tagLength: 16,
  iterations: 100000,
  keyLength: 32,
};

/**
 * Generates a random salt for PBKDF2.
 *
 * @param length - Salt length in bytes (default: 32)
 * @returns Random salt
 *
 * @example
 * ```typescript
 * const salt = generateSalt(32);
 * ```
 */
export function generateSalt(length = DEFAULT_OPTIONS.saltLength): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generates a random initialization vector (IV) for AES.
 *
 * @param length - IV length in bytes (default: 16)
 * @returns Random IV
 *
 * @example
 * ```typescript
 * const iv = generateIV(16);
 * ```
 */
export function generateIV(length = DEFAULT_OPTIONS.ivLength): string {
  return randomBytes(length).toString('hex');
}

/**
 * Derives a cryptographic key from a password using PBKDF2.
 *
 * @param password - Password or key material
 * @param salt - Salt for key derivation
 * @param iterations - PBKDF2 iterations (default: 100000)
 * @param keyLength - Derived key length (default: 32)
 * @returns Derived key as buffer
 *
 * @example
 * ```typescript
 * const key = deriveKey('my-password', 'salt-from-generateSalt');
 * ```
 */
export function deriveKey(
  password: string,
  salt: string,
  iterations = DEFAULT_OPTIONS.iterations,
  keyLength = DEFAULT_OPTIONS.keyLength
): Buffer {
  return scryptSync(password, salt, keyLength, {
    N: 1 << 14, // 16384 iterations
    r: 8,
    p: 1,
  });
}

/**
 * Encrypts data using AES-256-GCM.
 *
 * @param data - Data to encrypt
 * @param password - Encryption password
 * @param options - Encryption options
 * @returns Encrypted data with marker prefix
 *
 * @example
 * ```typescript
 * const encrypted = encrypt('my-secret', 'my-password');
 * // Returns: 'ENC:<encrypted-data>'
 * ```
 */
export function encrypt(
  data: string,
  password: string,
  options?: Partial<EncryptionOptions>
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options, key: password };

  if (!password) {
    throw new Error('Encryption key is required');
  }

  try {
    // Generate random salt and IV
    const salt = randomBytes(opts.saltLength);
    const iv = randomBytes(opts.ivLength);

    // Derive key from password
    const key = deriveKey(password, salt.toString('hex'), opts.iterations, opts.keyLength);

    // Create cipher (GCM mode default tag length is 16 bytes)
    const cipher = createCipheriv(opts.algorithm as any, key, iv);

    // Encrypt data
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    // @ts-ignore - Type definitions don't include getAuthTag
    const tag = cipher.getAuthTag();

    // Combine: salt + iv + tag + encrypted data
    const result = `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;

    // Encode based on option (encode the colon-separated result string)
    let encoded: string;
    if (opts.encoding === 'base64') {
      encoded = Buffer.from(result).toString('base64');
    } else {
      encoded = result; // Already in hex format with colons
    }

    // Add marker
    return `${opts.marker}${encoded}`;
  } catch (error: any) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypts data encrypted with encrypt().
 *
 * @param encryptedData - Encrypted data with marker prefix
 * @param password - Decryption password
 * @param options - Decryption options (must match encryption options)
 * @returns Decrypted data
 *
 * @example
 * ```typescript
 * const decrypted = decrypt('ENC:<encrypted-data>', 'my-password');
 * // Returns: 'my-secret'
 * ```
 */
export function decrypt(
  encryptedData: string,
  password: string,
  options?: Partial<EncryptionOptions>
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options, key: password };

  if (!password) {
    throw new Error('Decryption key is required');
  }

  try {
    // Check marker
    if (!encryptedData.startsWith(opts.marker)) {
      throw new Error('Invalid encrypted data format');
    }

    // Remove marker
    const encoded = encryptedData.slice(opts.marker.length);

    // Decode (get back the colon-separated hex string)
    const hexData = opts.encoding === 'base64'
      ? Buffer.from(encoded, 'base64').toString('utf8')
      : encoded; // Already in colon-separated hex format

    // Split: salt:iv:tag:encrypted
    const parts = hexData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const [saltHex, ivHex, tagHex, encrypted] = parts;

    // Parse components
    const salt = Buffer.from(saltHex!, 'hex');
    const iv = Buffer.from(ivHex!, 'hex');
    const tag = Buffer.from(tagHex!, 'hex');

    // Derive key
    const key = deriveKey(password, saltHex!, opts.iterations, opts.keyLength);

    // Create decipher (GCM mode default tag length is 16 bytes)
    const decipher = createDecipheriv(opts.algorithm as any, key, iv);

    // Set authentication tag
    // @ts-ignore - Type definitions don't include setAuthTag
    decipher.setAuthTag(tag);

    // Decrypt data
    const part1 = decipher.update(encrypted!, 'hex', 'utf8');
    const part2 = decipher.final('utf8');

    return part1 + part2;
  } catch (error: any) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Checks if a string is encrypted (starts with marker).
 *
 * @param value - Value to check
 * @param marker - Marker to look for (default: 'ENC:')
 * @returns True if value is encrypted
 *
 * @example
 * ```typescript
 * isEncrypted('ENC:abc123...') // true
 * isEncrypted('plain-text') // false
 * ```
 */
export function isEncrypted(value: string, marker = DEFAULT_OPTIONS.marker): boolean {
  return typeof value === 'string' && value.startsWith(marker);
}

/**
 * Encrypts an object by encrypting all its string values.
 *
 * @param obj - Object to encrypt
 * @param password - Encryption password
 * @param options - Encryption options
 * @returns Object with encrypted values
 *
 * @example
 * ```typescript
 * const encrypted = encryptObject({ password: 'secret' }, 'my-password');
 * // Returns: { password: 'ENC:<encrypted>' }
 * ```
 */
export function encryptObject(
  obj: Record<string, unknown>,
  password: string,
  options?: Partial<EncryptionOptions>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = encrypt(value, password, options);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = encryptObject(value as Record<string, unknown>, password, options);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Decrypts an object by decrypting all encrypted values.
 *
 * @param obj - Object to decrypt
 * @param password - Decryption password
 * @param options - Decryption options
 * @returns Object with decrypted values
 *
 * @example
 * ```typescript
 * const decrypted = decryptObject({ password: 'ENC:abc123...' }, 'my-password');
 * // Returns: { password: 'secret' }
 * ```
 */
export function decryptObject(
  obj: Record<string, unknown>,
  password: string,
  options?: Partial<EncryptionOptions>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && isEncrypted(value, options?.marker)) {
      result[key] = decrypt(value, password, options);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = decryptObject(value as Record<string, unknown>, password, options);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Creates a hash of a string using SHA-256.
 *
 * @param data - Data to hash
 * @returns SHA-256 hash
 *
 * @example
 * ```typescript
 * const hash = hashString('my-data');
 * ```
 */
export function hashString(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Validates encryption options.
 *
 * @param options - Options to validate
 * @returns Validated options
 *
 * @example
 * ```typescript
 * const validated = validateOptions({ key: 'my-password' });
 * ```
 */
export function validateOptions(options: Partial<EncryptionOptions>): Required<EncryptionOptions> {
  const validated = { ...DEFAULT_OPTIONS, ...options };

  if (!validated.key) {
    throw new Error('Encryption key is required');
  }

  if (validated.algorithm !== 'aes-256-gcm') {
    throw new Error('Only aes-256-gcm algorithm is supported');
  }

  if (!['base64', 'hex'].includes(validated.encoding)) {
    throw new Error('Encoding must be "base64" or "hex"');
  }

  return validated;
}
