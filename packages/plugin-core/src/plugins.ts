import { type Arguments, type Commands, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const commands: Commands = {
  ['list-plugins']: {
    description:
      'prints the list of available plugins to stdout, passes input along',
    run: async (
      input: string | Readable,
      _args: Arguments,
      runtime: IPluginRuntime
    ): Promise<string | Readable> => {
      // Lazy. Sort by name, so duplicates are clearly visible.
      process.stdout.write(
        `Available plugins:\n\n${runtime.pluginNames.join('\n')}\n\n`
      );
      return input;
    },
  },
};

export default commands;
