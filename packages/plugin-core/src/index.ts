import { mergeCommands, type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };
import assets from './assets.ts';
import formats from './formats.ts';
import input from './input.ts';
import io from './io.ts';
import plugins from './plugins.ts';
import string from './string.ts';

const plugin: Plugin = {
  name: pkg.name,
  commands: mergeCommands(pkg.name, [
    assets,
    formats,
    input,
    io,
    plugins,
    string,
  ]),
};

export default plugin;
