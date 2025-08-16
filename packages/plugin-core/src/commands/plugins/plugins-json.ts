import { type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const command: Command = {
  description: 'replaces input with a full information on available plugins',
  run: async (_input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    return JSON.stringify(runtime.plugins);
  },
};

export default command;
