import { type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const command: Command = {
  description: 'prints the list of available plugins to stdout, passes input along',
  run: async (input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    process.stdout.write(`Available plugins:\n\n${runtime.pluginNames.join('\n')}\n\n`);
    return input;
  },
};

export default command;
