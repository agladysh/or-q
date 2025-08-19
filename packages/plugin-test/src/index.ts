import { loadModuleAssets, type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };
import commands from './commands/index.ts';

export * from './lib/index.ts';

const plugin: Plugin = {
  name: pkg.name,
  assets: loadModuleAssets(import.meta.url),
  commands: commands,
};

export default plugin;
