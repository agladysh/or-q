import { loadModuleAssets, mergeCommands, type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

import completions from './completions.ts';
import conversation from './conversation.ts';
import models from './models.ts';

const plugin: Plugin = {
  name: pkg.name,
  assets: loadModuleAssets(import.meta.url),
  commands: mergeCommands(pkg.name, [completions, conversation, models]),
};

export default plugin;
