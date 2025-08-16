import { loadModuleAssets, type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

import exec from './commands/exec.ts';
import run from './commands/run.ts';
import forever from './commands/forever.ts';
import _DATA from './commands/_DATA.ts';
import _JSON from './commands/_JSON.ts';
import helpScripts from './commands/help-scripts.ts';
import helpScript from './commands/help-script.ts';
import discoverScripts from './commands/discover-scripts.ts';
import discoverScript from './commands/discover-script.ts';

const plugin: Plugin = {
  name: pkg.name,
  description: pkg.description,
  assets: loadModuleAssets(import.meta.url),
  commands: {
    exec,
    run,
    forever,
    _DATA,
    _JSON,
    'help-scripts': helpScripts,
    'help-script': helpScript,
    'discover-scripts': discoverScripts,
    'discover-script': discoverScript,
  },
};

export default plugin;
