import { commandArgument, readableToString, type Arguments, type Commands, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const commands: Commands = {
  unquote: {
    description: 'unquotes input JSON string (useful in conjunction with jp)',
    run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
      input = await readableToString(input);
      return JSON.parse(input);
    },
  },
  quote: {
    description: 'quotes input to JSON string',
    run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
      input = await readableToString(input);
      return JSON.stringify(input);
    },
  },
  replace: {
    description: 'replaces substring with new string in input',
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const from = await commandArgument(runtime, args.shift(), `usage: replace "<from>" "<to>"`);
      const to = await commandArgument(runtime, args.shift(), `usage: replace "<from>" "<to>"`);
      input = await readableToString(input);
      return input.replaceAll(from, to);
    },
  },
};

export default commands;
