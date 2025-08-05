import type { Plugin } from '@or-q/lib';
import { readableToString } from '@or-q/lib';
import { Readable } from 'node:stream';
import yaml from 'yaml';

import pkg from '../package.json' with { type: 'json' };

const plugin: Plugin = {
  name: pkg.name,
  commands: {
    pretty: {
      description: 'pretty-prints JSON',
      run: async (
        input: string | Readable,
        _args: string[]
      ): Promise<string | Readable> => {
        return JSON.stringify(
          JSON.parse(await readableToString(input)),
          null,
          2
        );
      },
    },
    yaml: {
      description: 'converts JSON to YAML',
      run: async (
        input: string | Readable,
        _args: string[]
      ): Promise<string | Readable> => {
        return yaml.stringify(JSON.parse(await readableToString(input)));
      },
    },
  },
};

export default plugin;
