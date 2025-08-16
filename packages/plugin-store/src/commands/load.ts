import { commandArgument, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import { getStore } from '../utils.ts';

const usage = 'usage: load "<text>"';

const command: Command = {
  description: 'loads a named value from the store, replacing input with it, unknown values are empty strings',
  usage,
  tags: ['utility'],
  run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const key = await commandArgument(runtime, args.shift(), usage);
    return getStore(runtime)[key] ?? '';
  },
};

export default command;
