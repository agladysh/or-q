import { readableToString, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import { renderORQ } from '../utils.ts';

const usage = 'usage: render';

const command: Command = {
  description: 'treats input as a template and instantiates it from @orq/store',
  usage,
  tags: [],
  run: async (input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    return renderORQ(runtime, await readableToString(input));
  },
};

export default command;
