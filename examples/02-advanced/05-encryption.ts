/**
 * Example 17: Configuration Encryption
 *
 * This example shows how to encrypt sensitive configuration values.
 */

import { loadConfig } from '@oxog/config';
import { encryptionPlugin } from '@oxog/config/plugins';

async function main() {
  const config = await loadConfig({
    name: 'myapp',
    paths: ['./config.enc.yaml'],
  });

  // Add encryption plugin
  config.use(encryptionPlugin({
    password: process.env.CONFIG_PASSWORD!,
  }));

  // Encrypted values are automatically decrypted
  const apiKey = config.get('apiKey');  // Decrypted automatically
  const databasePassword = config.get('database.password');  // Decrypted automatically

  console.log('API Key:', apiKey);
  console.log('DB Password:', databasePassword);

  // Manually encrypt a value
  const encryptedValue = config.encrypt('sensitive-data');
  console.log('Encrypted:', encryptedValue);

  // Manually decrypt a value
  const decryptedValue = config.decrypt(encryptedValue);
  console.log('Decrypted:', decryptedValue);
}

main().catch(console.error);
