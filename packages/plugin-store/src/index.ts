import { type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

import load from './commands/load.ts';
import save from './commands/save.ts';
import set from './commands/set.ts';
import setdata from './commands/setdata.ts';

const plugin: Plugin = {
  name: pkg.name,
  description: pkg.description,
  commands: {
    load,
    save,
    set,
    setdata,
  },
};

export default plugin;
