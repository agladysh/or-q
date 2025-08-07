import type { Arguments, IPluginRuntime, Plugin } from '@or-q/lib';
import { commandArgument, spawnText } from '@or-q/lib';
import type { Readable } from 'node:stream';
import pkg from '../package.json' with { type: 'json' };

const plugin: Plugin = {
  name: pkg.name,
  commands: {
    shell: {
      description: 'run a shell command (use with caution)',
      run: async (
        input: string | Readable,
        args: Arguments,
        runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        const command = await commandArgument(
          runtime,
          args.shift(),
          'usage: shell "[shell command]"'
        );
        return spawnText(command, input, { shell: true });
      },
    },
  },
};

export default plugin;
