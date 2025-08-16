import { commandArgument, fail, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import yaml from 'yaml';
import { macros } from '../utils.ts';

const usage = 'usage: $defmacro <name> <def>';

const command: Command = {
  description: 'stores or overrides a macro definition, forwards input',
  usage,
  tags: ['utility'],
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const name = await commandArgument(runtime, args.shift(), usage);
    const defArg = args.shift();
    if (defArg === undefined) {
      return fail(usage);
    }
    // Lazy. Must check schema.
    const def = (typeof defArg === 'string' ? yaml.parse(defArg) : defArg) as Arguments;
    if (macros[name]) {
      // Lazy. This should have asset-like name resolution instead.
      return fail(`duplicate macro definition ${name}`);
    }
    macros[name] = def;

    return input;
  },
};

export default command;
