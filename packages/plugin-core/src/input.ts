import { commandArgument, readableToString, type Arguments, type Commands, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const commands: Commands = {
  prepend: {
    description: 'prepends argument to input, does NOT insert a newline at either end of argument',
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const text = await commandArgument(runtime, args.shift(), 'usage: append "\n<text>\n"');
      input = await readableToString(input);
      return `${text}${input}`;
    },
  },
  append: {
    description: 'appends argument to input, does NOT insert a newline at either end of argument',
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const text = await commandArgument(runtime, args.shift(), 'usage: append "\n<text>\n"');
      input = await readableToString(input);
      return `${input}${text}`;
    },
  },
};

export default commands;
