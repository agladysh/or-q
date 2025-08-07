import { type Arguments, type Commands, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const commands: Commands = {
  dump: {
    description: 'replaces input with remaining program dump',
    run: async (
      _input: string | Readable,
      args: Arguments,
      _runtime: IPluginRuntime
    ): Promise<string | Readable> => {
      return JSON.stringify(args);
    },
  },
};

export default commands;
