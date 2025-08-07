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
      process.stdout.write(
        `Available plugins:\n\n${runtime.pluginNames.join('\n')}\n\n`
      );
      return input;
    },
  },
  ['plugins-json']: {
    description: 'replaces input with a full information on available plugins',
    run: async (
      _input: string | Readable,
      _args: Arguments,
      runtime: IPluginRuntime
    ): Promise<string | Readable> => {
      return JSON.stringify(runtime.plugins);
    },
  },
};

export default commands;
