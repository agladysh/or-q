import { mergeCommands, loadModuleAssets, type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };
import assets from './assets.ts';
import controlflow from './controlflow.ts';
import debug from './debug.ts';
import error from './error.ts';
import functional from './functional.ts';
import input from './input.ts';
import io from './io.ts';
import log from './log.ts';
import plugins from './plugins.ts';
import string from './string.ts';

const plugin: Plugin = {
  name: pkg.name,
  assets: loadModuleAssets(import.meta.url),
  commands: mergeCommands(pkg.name, [assets, controlflow, debug, error, functional, input, io, log, plugins, string]),
};

export default plugin;
