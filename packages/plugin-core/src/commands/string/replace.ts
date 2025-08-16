import { commandArgument, readableToString, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const usage = 'usage: replace "<from>" "<to>"';

const command: Command = {
  description: 'replaces substring with new string in input',
  usage,
  tags: ['data'],
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const from = await commandArgument(runtime, args.shift(), usage);
    const to = await commandArgument(runtime, args.shift(), usage);
    input = await readableToString(input);
    return input.replaceAll(from, to);
  },
};

export default command;
