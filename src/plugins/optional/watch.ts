import type { ConfigKernel } from '../../kernel.js';
import type { ConfigPlugin } from '../../types.js';

export function watchPlugin(): ConfigPlugin {
  return {
    name: 'watch',
    version: '1.0.0',
    install(kernel: ConfigKernel) {
      return;
    },
  };
}

export default watchPlugin();
