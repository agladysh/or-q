import { mergeCommands, type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };
import cat from './cat.ts';
import dirtree from './dirtree.ts';
import glob from './glob.ts';
import ignore from './ignore.ts';

const plugin: Plugin = {
  name: pkg.name,
  commands: mergeCommands(pkg.name, [cat, dirtree, glob, ignore]),
};

export default plugin;
