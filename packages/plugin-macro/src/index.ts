import { type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

import defmacro from './commands/$defmacro.ts';
import macro from './commands/$macro.ts';
import arg from './commands/$arg.ts';

const plugin: Plugin = {
  name: pkg.name,
  description: pkg.description,
  commands: {
    $defmacro: defmacro,
    $macro: macro,
    $arg: arg,
  },
};

export default plugin;
