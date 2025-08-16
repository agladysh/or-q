import { commandArgument, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import { glob } from 'glob';
import type { Readable } from 'node:stream';

const usage = 'usage: glob3 "pattern" "ignore-pattern" "options"';

const command: Command = {
  description: 'replaces input with a list of files matching pattern in JSON, accepts arguments as JSON values',
  usage,
  tags: ['utility'],
  run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    // Lazy. Should validate schemas
    const patterns = JSON.parse(await commandArgument(runtime, args.shift(), usage));
    const ignores = JSON.parse(await commandArgument(runtime, args.shift(), usage));
    const options = JSON.parse(await commandArgument(runtime, args.shift(), usage));

    const entries = await glob(patterns, {
      ...options,
      ignore: ignores,
      cwd: process.cwd(),
      nodir: options.nodir ?? true,
    });
    return JSON.stringify(entries, null, 2);
  },
};

export default command;
