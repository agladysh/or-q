import { Readable } from 'node:stream';
import type { Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

const plugin: Plugin = {
  name: pkg.name,
  commands: {
    ['-']: {
      description: 'read data from stdin, ignoring input',
      run: async (
        _input: string | Readable,
        _args: string[]
      ): Promise<string | Readable> => {
        return process.stdin;
      },
    },
  },
};

export default plugin;
