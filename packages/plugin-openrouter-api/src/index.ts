import type { Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

import * as models from './models.ts';

const plugin: Plugin = {
  name: pkg.name,
  commands: {
    [models.name]: models.command,
  },
};

export default plugin;
