import { commandArgument, fail, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import { getStore } from '../utils.ts';

const usage = 'usage: setdata "<key>" "<value>"';

const command: Command = {
  description: 'sets key to value in store, treating value as data and serializing it to JSON, forwards input',
  usage,
  tags: [],
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const key = await commandArgument(runtime, args.shift(), usage);
    const value = args.shift();
    if (value === undefined) {
      return fail(usage);
    }
    getStore(runtime)[key] = JSON.stringify(value);
    return input;
  },
};

export default command;
