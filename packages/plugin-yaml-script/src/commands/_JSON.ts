import { type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import { loadInputFromJSONCommand } from '../utils.ts';

const usage = 'usage: _JSON';

const command: Command = {
  description: 'replaces input with special format argument serialized as JSON',
  usage,
  tags: [],
  run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    return JSON.stringify(await loadInputFromJSONCommand(runtime, args));
  },
};

export default command;
