import { commandArgument, fail, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const usage = 'usage: fail "<message>"';

const command: Command = {
  description: 'fails with an error message',
  usage,
  run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const message = await commandArgument(runtime, args.shift(), usage);
    return fail(message);
  },
};

export default command;
