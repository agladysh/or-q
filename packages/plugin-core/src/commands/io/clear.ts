import { type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const command: Command = {
  description: 'replaces input with empty string',
  run: async (_input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
    return '';
  },
};

export default command;
