import { commandArgument, spawnText, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const usage = 'usage: shell "[shell command]"';

const command: Command = {
  description: 'run a shell command (use with caution)',
  usage,
  tags: ['utility'],
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const command = await commandArgument(runtime, args.shift(), usage);
    return spawnText(command, input, { shell: true });
  },
};

export default command;
