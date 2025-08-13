import { loadModuleAssets, mergeCommands, type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

import ollama from './ollama.ts';

const plugin: Plugin = {
  name: pkg.name,
  assets: loadModuleAssets(import.meta.url),
  commands: mergeCommands(pkg.name, [ollama]),
};

export default plugin;
