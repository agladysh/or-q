import type { Readable } from 'node:stream';
import { fail, spawnText } from '@or-q/lib';
import type { Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

const plugin: Plugin = {
  name: pkg.name,
  commands: {
    shell: {
      description: 'run a shell command (use with caution)',
      run: async (
        input: string | Readable,
        args: string[]
      ): Promise<string | Readable> => {
        const command = args.shift();
        // Lazy, this should be enforced by caller, including usage.
        if (command === undefined) {
          fail('usage: shell "[shell command]"');
        }
        return spawnText(command, input, { shell: true });
      },
    },
  },
};

export default plugin;
