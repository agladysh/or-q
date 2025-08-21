import { loadModuleAssets, mergeCommands, type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };
import file from './file.ts';
import dirtree from './dirtree.ts';
import glob from './glob.ts';
import ignore from './ignore.ts';

const plugin: Plugin = {
  name: pkg.name,
  assets: loadModuleAssets(import.meta.url),
  commands: mergeCommands(pkg.name, [file, dirtree, glob, ignore]),
};

export default plugin;
