import { type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

import shell from './commands/shell.ts';

const plugin: Plugin = {
  name: pkg.name,
  description: pkg.description,
  commands: {
    shell,
  },
};

export default plugin;
