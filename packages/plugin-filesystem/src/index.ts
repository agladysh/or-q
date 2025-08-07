import { mergeCommands, type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };
import dirtree from './dirtree.ts';
import glob from './glob.ts';

const plugin: Plugin = {
  name: pkg.name,
  commands: mergeCommands(pkg.name, [dirtree, glob]),
};

export default plugin;
