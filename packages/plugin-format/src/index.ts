import { type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

import pretty from './commands/pretty.ts';
import yaml from './commands/yaml.ts';

const plugin: Plugin = {
  name: pkg.name,
  description: pkg.description,
  commands: {
    pretty,
    yaml,
  },
};

export default plugin;
