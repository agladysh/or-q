import { commandArgument, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import { getStore } from '../utils.ts';

const usage = 'usage: save "<key>"';

const command: Command = {
  description: 'saves input into a named value of the store, passes input along',
  usage,
  tags: [],
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const key = await commandArgument(runtime, args.shift(), usage);
    getStore(runtime)[key] = input; // Should we read Readable?
    return input;
  },
};

export default command;
