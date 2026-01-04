import { tomlParser } from '../../parsers/toml.js';
import type { ConfigKernel } from '../../kernel.js';
import type { ConfigPlugin } from '../../types.js';

export function tomlParserPlugin(): ConfigPlugin {
  return {
    name: 'toml-parser',
    version: '1.0.0',
    install(kernel: ConfigKernel) {
      return;
    },
  };
}

export default tomlParserPlugin();
