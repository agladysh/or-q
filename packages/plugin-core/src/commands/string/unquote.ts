import { readableToString, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const command: Command = {
  description: 'unquotes input JSON string (useful in conjunction with jp)',
  usage: 'usage: unquote',
  tags: ['data'],
  run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
    input = await readableToString(input);
    return JSON.parse(input);
  },
};

export default command;
