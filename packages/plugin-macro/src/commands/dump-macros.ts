import { type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import { macros } from '../utils.ts';

const usage = 'usage: dump-macros';

const command: Command = {
  description: 'replaces input with macros saved as JSON',
  usage,
  tags: [],
  run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
    process.stdout.write(`${JSON.stringify(macros, null, 2)}\n`);
    return input;
  },
};

export default command;
