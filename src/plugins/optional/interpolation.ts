import type { ConfigKernel } from '../../kernel.js';
import type { ConfigPlugin } from '../../types.js';

export function interpolationPlugin(): ConfigPlugin {
  return {
    name: 'interpolation',
    version: '1.0.0',
    install(kernel: ConfigKernel) {
      return;
    },
  };
}

export default interpolationPlugin();
