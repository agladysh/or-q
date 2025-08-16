import { type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const command: Command = {
  description: 'forwards input (useful for program arguments sometimes)',
  usage: 'usage: input',
  tags: ['io'],
  run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
    return input;
  },
};

export default command;
