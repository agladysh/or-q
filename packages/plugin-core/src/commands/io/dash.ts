import { type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const command: Command = {
  description: 'read data from stdin, ignoring input',
  usage: 'usage: dash',
  tags: ['io'],
  run: async (_input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
    return process.stdin;
  },
};

export default command;
