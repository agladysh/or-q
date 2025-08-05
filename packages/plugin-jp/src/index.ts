import type { Readable } from 'node:stream';
import { fail, spawnText } from '@or-q/lib';
import type { Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

const plugin: Plugin = {
  name: pkg.name,
  commands: {
    jp: {
      description: "run JMSEPath's jp command",
      run: async (
        input: string | Readable,
        args: string[]
      ): Promise<string | Readable> => {
        const query = args.shift();
        // Lazy, this should be enforced by caller, including usage.
        if (query === undefined) {
          fail('usage: jp "[JMSEPath query string]"');
        }
        return spawnText('jp', input, { args: [query] });
      },
    },
  },
};

export default plugin;
