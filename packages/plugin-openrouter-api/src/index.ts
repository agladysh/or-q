import { loadModuleAssets, type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

import completions from './completions.ts';
import conversation from './conversation.ts';
import models from './models.ts';

// Lazy. Should support more calls.
const plugin: Plugin = {
  name: pkg.name,
  assets: loadModuleAssets(import.meta.url),
  // Lazy. Should check for name overrides
  commands: Object.fromEntries(
    [completions, conversation, models].flatMap(Object.entries)
  ),
};

export default plugin;
