import { readableToString, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const command: Command = {
  description: 'outputs end-trimmed input to stdout, passes it along untrimmed',
  usage: 'usage: tee',
  tags: ['io'],
  run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
    input = await readableToString(input);
    process.stdout.write(`${input.trimEnd()}\n`);
    return input;
  },
};

export default command;
