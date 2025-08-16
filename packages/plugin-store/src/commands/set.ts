import { commandArgument, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import { getStore } from '../utils.ts';

const usage = 'usage: set "<key>" "<value>"';

const command: Command = {
  description: 'sets key to value in store, forwards input',
  usage,
  tags: [],
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const key = await commandArgument(runtime, args.shift(), usage);
    const value = await commandArgument(runtime, args.shift(), usage);
    getStore(runtime)[key] = value;
    return input;
  },
};

export default command;
