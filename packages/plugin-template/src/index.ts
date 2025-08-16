import { type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

import t from './commands/t.ts';
import f from './commands/f.ts';
import render from './commands/render.ts';

const plugin: Plugin = {
  name: pkg.name,
  description: pkg.description,
  commands: {
    t,
    f,
    render,
  },
};

export default plugin;
