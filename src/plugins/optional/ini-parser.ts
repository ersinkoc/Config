import { iniParser } from '../../parsers/ini.js';
import type { ConfigKernel } from '../../kernel.js';
import type { ConfigPlugin } from '../../types.js';

export function iniParserPlugin(): ConfigPlugin {
  return {
    name: 'ini-parser',
    version: '1.0.0',
    install(kernel: ConfigKernel) {
      return;
    },
  };
}

export default iniParserPlugin();
