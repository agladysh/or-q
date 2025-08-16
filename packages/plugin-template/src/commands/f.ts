import { commandArgument, readableToString, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import { renderORQ } from '../utils.ts';

const usage = 'usage: f "[template]"';

const command: Command = {
  description: 'replaces input with a template instantiated from @orq/store, feeding it input',
  usage,
  tags: ['utility'],
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const template = await commandArgument(runtime, args.shift(), usage);
    input = await readableToString(input); // Reading it as string to preserve stream.
    return renderORQ(runtime, template, input);
  },
};

export default command;
