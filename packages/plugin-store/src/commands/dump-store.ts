import { type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import { getStore } from '../utils.ts';

const usage = 'usage: dump-store';

const command: Command = {
  description: 'dumps store content to stdout as JSON, passes input forward',
  usage,
  tags: [],
  run: async (input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    process.stdout.write(`${JSON.stringify(getStore(runtime), null, 2)}\n`);
    return input;
  },
};

export default command;
