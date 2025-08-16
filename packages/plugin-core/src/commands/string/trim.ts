import { readableToString, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const command: Command = {
  description: 'trims input',
  run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
    input = await readableToString(input);
    return input.trim();
  },
};

export default command;
