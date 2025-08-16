import { type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

import jp from './commands/jp.ts';

const plugin: Plugin = {
  name: pkg.name,
  description: pkg.description,
  commands: {
    jp,
  },
};

export default plugin;
