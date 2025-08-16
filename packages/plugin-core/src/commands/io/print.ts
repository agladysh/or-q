import { commandArgument, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const usage = 'usage: print "<text>"';

const command: Command = {
  description: 'prints trimmed argument to stdout, passing input forward',
  usage,
  tags: ['io'],
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const text = await commandArgument(runtime, args.shift(), usage);
    process.stdout.write(`${text.trim()}\n`);
    return input;
  },
};

export default command;
