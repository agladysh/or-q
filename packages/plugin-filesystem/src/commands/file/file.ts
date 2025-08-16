import { readableToString, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import { readFileSync } from 'node:fs';
import type { Readable } from 'node:stream';

const usage = 'usage: file';

const command: Command = {
  description: 'converts input filename to the file contents',
  usage,
  tags: [],
  run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
    const filename = await readableToString(input);
    return readFileSync(filename, 'utf-8');
  },
};

export default command;
