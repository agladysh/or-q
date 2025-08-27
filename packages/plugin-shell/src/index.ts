import type { IProgram, Plugin } from '@or-q/lib';
import { commandArgument, loadModuleAssets, spawnText } from '@or-q/lib';
import type { Readable } from 'node:stream';
import pkg from '../package.json' with { type: 'json' };

const plugin: Plugin = {
  name: pkg.name,
  assets: loadModuleAssets(import.meta.url),
  commands: {
    shell: {
      description: 'run a shell command (use with caution)',
      run: async (input: string | Readable, program: IProgram): Promise<string | Readable> => {
        const usage = 'usage: shell "[shell command]"';
        const command = await commandArgument(runtime, args.shift(), usage);
        return spawnText(command, input, { shell: true });
      },
    },
  },
};

export default plugin;
