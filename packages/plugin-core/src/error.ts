import { commandArgument, fail, type Arguments, type Commands, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const commands: Commands = {
  fail: {
    description: 'fails with an error message',
    run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const message = await commandArgument(runtime, args.shift(), 'usage: fail "<message>"');
      return fail(message);
    },
  },
};

export default commands;
