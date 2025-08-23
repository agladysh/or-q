import type { IProgram, Plugin } from '@or-q/lib';
import { loadModuleAssets, spawnText } from '@or-q/lib';
import type { Readable } from 'node:stream';
import pkg from '../package.json' with { type: 'json' };

// Lazy, this should use JS module!
const plugin: Plugin = {
  name: pkg.name,
  assets: loadModuleAssets(import.meta.url),
  commands: {
    jp: {
      description: "run JMSEPath's jp command",
      run: async (input: string | Readable, program: IProgram): Promise<string | Readable> => {
        const usage = 'usage: jp "[JMSEPath query string]"';
        const query = await program.ensureNext(usage).toString();
        return spawnText('jp', input, { args: [query] });
      },
    },
  },
};

export default plugin;
