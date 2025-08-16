import { type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

import exec from './commands/exec.ts';
import listScriptAssets from './commands/list-script-assets.ts';
import run from './commands/run.ts';
import forever from './commands/forever.ts';
import _DATA from './commands/_DATA.ts';
import _JSON from './commands/_JSON.ts';

const plugin: Plugin = {
  name: pkg.name,
  description: pkg.description,
  commands: {
    exec,
    'list-script-assets': listScriptAssets,
    run,
    forever,
    _DATA,
    _JSON,
  },
};

export default plugin;
