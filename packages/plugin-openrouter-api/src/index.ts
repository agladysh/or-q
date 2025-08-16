import { loadModuleAssets, type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

import completions from './commands/completions.ts';
import conversation from './commands/conversation/conversation.ts';
import system from './commands/conversation/system.ts';
import user from './commands/conversation/user.ts';
import assistant from './commands/conversation/assistant.ts';
import tool from './commands/conversation/tool.ts';
import temperature from './commands/conversation/temperature.ts';
import models from './commands/models.ts';

const plugin: Plugin = {
  name: pkg.name,
  description: pkg.description,
  assets: loadModuleAssets(import.meta.url),
  commands: {
    completions,
    conversation,
    system,
    user,
    assistant,
    tool,
    temperature,
    models,
  },
};

export default plugin;
