import { type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const command: Command = {
  description: 'replaces input with remaining program dump',
  run: async (_input: string | Readable, args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
    return JSON.stringify(args);
  },
};

export default command;
