import { readableToString, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const usage = 'usage: pretty';

const command: Command = {
  description: 'pretty-prints JSON',
  usage,
  tags: ['data'],
  run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
    return JSON.stringify(JSON.parse(await readableToString(input)), null, 2);
  },
};

export default command;
