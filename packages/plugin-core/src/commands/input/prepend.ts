import { commandArgument, readableToString, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const usage = 'usage: prepend "<text>"';

const command: Command = {
  description: 'prepends argument to input, does NOT insert a newline at either end of argument',
  usage,
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const text = await commandArgument(runtime, args.shift(), usage);
    input = await readableToString(input);
    return `${text}${input}`;
  },
};

export default command;
