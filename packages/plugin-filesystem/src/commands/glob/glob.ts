import { commandArgument, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import { glob } from 'glob';
import type { Readable } from 'node:stream';

const usage = 'usage: glob "pattern" "ignore-pattern"';

const command: Command = {
  description: 'replaces input with a list of files matching pattern in JSON',
  usage,
  tags: [],
  run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const pattern = await commandArgument(runtime, args.shift(), usage);
    const ignore = await commandArgument(runtime, args.shift(), usage);
    const entries = await glob(pattern, {
      ignore: ignore,
      cwd: process.cwd(),
      nodir: true,
    });
    return JSON.stringify(entries, null, 2);
  },
};

export default command;
