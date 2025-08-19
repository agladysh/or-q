import type { Arguments, IPluginRuntime, Plugin } from '@or-q/lib';
import { readableToString } from '@or-q/lib';
import type { Readable } from 'node:stream';
import yaml from 'yaml';

import pkg from '../package.json' with { type: 'json' };

const plugin: Plugin = {
  name: pkg.name,
  commands: {
    pretty: {
      description: 'pretty-prints JSON',
      run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
        return JSON.stringify(JSON.parse(await readableToString(input)), null, 2);
      },
    },
    yaml: {
      description: 'converts JSON to YAML',
      run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
        return yaml.stringify(JSON.parse(await readableToString(input)));
      },
    },
    tsv: {
      description: 'converts input JSON or YAML array of arrays to TSV',
      run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
        // Lazy. Very fragile. Use a real library.
        input = await readableToString(input);
        const data = yaml.parse(input) as Array<string>[][];
        return data.map((row) => `${row.join('\t')}`).join('\n');
      },
    },
  },
};

export default plugin;
