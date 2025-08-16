import { commandArgument, readableToString, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const usage = 'usage: default "<text>"';

const command: Command = {
  description: 'if input is empty, replaces it with argument',
  usage,
  tags: ['io'],
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const text = await commandArgument(runtime, args.shift(), usage);
    input = await readableToString(input);
    return input === '' ? text : input;
  },
};

export default command;
