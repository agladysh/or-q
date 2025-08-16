import { commandArgument, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const usage = 'usage: echo "<text>"';

const command: Command = {
  description: 'replaces input with argument',
  usage,
  tags: ['io'],
  run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    return await commandArgument(runtime, args.shift(), usage);
  },
};

export default command;
