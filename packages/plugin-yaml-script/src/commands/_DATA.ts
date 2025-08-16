import { type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const usage = 'usage: _DATA';

const command: Command = {
  description: 'converts remaining program to JSON data in input',
  usage,
  tags: ['data'],
  run: async (_input: string | Readable, args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
    return JSON.stringify(args.splice(0, args.length));
  },
};

export default command;
