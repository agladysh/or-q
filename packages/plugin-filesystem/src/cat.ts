import { commandArgument, readableToString, type Arguments, type Commands, type IPluginRuntime } from '@or-q/lib';
import { readFileSync } from 'node:fs';
import type { Readable } from 'node:stream';

const commands: Commands = {
  ['cat-file']: {
    description: 'replaces input with the file contents from argument',
    run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const filename = await commandArgument(runtime, args.shift(), 'usage: cat <filename>');
      return readFileSync(filename, 'utf-8');
    },
  },
  ['file']: {
    description: 'converts input filename to the file contents',
    run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
      const filename = await readableToString(input);
      return readFileSync(filename, 'utf-8');
    },
  },
};

export default commands;
