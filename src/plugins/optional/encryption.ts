import type { ConfigKernel } from '../../kernel.js';
import type { ConfigPlugin } from '../../types.js';

export function encryptionPlugin(options: { key: string }): ConfigPlugin {
  return {
    name: 'encryption',
    version: '1.0.0',
    install(kernel: ConfigKernel) {
      return;
    },
  };
}

export default encryptionPlugin({ key: '' });
