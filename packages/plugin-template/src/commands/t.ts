import { commandArgument, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import { renderORQ } from '../utils.ts';

const usage = 'usage: t "[template]"';

const command: Command = {
  description: 'replaces input with a template instantiated from @orq/store',
  usage,
  tags: [],
  run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const template = await commandArgument(runtime, args.shift(), usage);
    return renderORQ(runtime, template);
  },
};

export default command;
