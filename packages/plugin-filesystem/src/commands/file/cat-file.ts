import { commandArgument, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import { readFileSync } from 'node:fs';
import type { Readable } from 'node:stream';

const usage = 'usage: cat-file <filename>';

const command: Command = {
  description: 'replaces input with the file contents from argument',
  usage,
  tags: ['utility'],
  run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const filename = await commandArgument(runtime, args.shift(), usage);
    return readFileSync(filename, 'utf-8');
  },
};

export default command;
