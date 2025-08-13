import type { Arguments, IPluginRuntime, Plugin } from '@or-q/lib';
import { commandArgument, spawnText } from '@or-q/lib';
import type { Readable } from 'node:stream';
import pkg from '../package.json' with { type: 'json' };

// Lazy, this should use JS module!
const plugin: Plugin = {
  name: pkg.name,
  commands: {
    jp: {
      description: "run JMSEPath's jp command",
      run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
        const query = await commandArgument(runtime, args.shift(), 'usage: jp "[JMSEPath query string]"');
        return spawnText('jp', input, { args: [query] });
      },
    },
  },
};

export default plugin;
