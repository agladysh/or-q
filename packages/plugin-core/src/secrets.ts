import { commandArgument, type Arguments, type Commands, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const commands: Commands = {
  secret: {
    description: 'replaces input with a secret',
    // Lazy. Protect the secret from exposure e.g. in logs.
    run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const id = await commandArgument(runtime, args.shift(), 'usage: secret "<id>"');
      return process.env[id] ?? '';
    },
  },
};

export default commands;
