import { loadModuleAssets, type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

import fetch from './commands/fetch.ts';

const plugin: Plugin = {
  name: pkg.name,
  description: pkg.description,
  assets: loadModuleAssets(import.meta.url),
  commands: {
    fetch,
  },
};

export default plugin;
