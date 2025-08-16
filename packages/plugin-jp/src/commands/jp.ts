import { commandArgument, spawnText, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const usage = 'usage: jp "[JMSEPath query string]"';

const command: Command = {
  description: "run JMSEPath's jp command",
  usage,
  tags: ['data'],
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const query = await commandArgument(runtime, args.shift(), usage);
    return spawnText('jp', input, { args: [query] });
  },
};

export default command;
