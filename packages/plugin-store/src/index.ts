import { fail, type Plugin } from '@or-q/lib';
import type { Readable } from 'node:stream';
import pkg from '../package.json' with { type: 'json' };

const store: Record<string, string | Readable> = {};

const plugin: Plugin = {
  name: pkg.name,
  commands: {
    load: {
      description:
        'loads a named value from the store, replacing input with it, unknown values are empty strings',
      run: async (
        _input: string | Readable,
        args: string[]
      ): Promise<string | Readable> => {
        const key = args.shift();
        // Lazy, this should be enforced by caller, including usage.
        if (key === undefined) {
          fail('usage: load "<text>"');
        }
        return store[key] ?? '';
      },
    },
    save: {
      description:
        'saves input into a named value of the store, passes input along',
      run: async (
        input: string | Readable,
        args: string[]
      ): Promise<string | Readable> => {
        const key = args.shift();
        // Lazy, this should be enforced by caller, including usage.
        if (key === undefined) {
          fail('usage: save "<key>"');
        }
        store[key] = input; // Should we read Readable?
        return input;
      },
    },
    set: {
      description:
        'loads a named value from the store, replacing input with it, unknown values are empty strings',
      run: async (
        input: string | Readable,
        args: string[]
      ): Promise<string | Readable> => {
        const key = args.shift();
        const value = args.shift();
        // Lazy, this should be enforced by caller, including usage.
        if (key === undefined || value === undefined) {
          fail('usage: set "<key>" "<value>"');
        }
        store[key] = value;
        return input;
      },
    },
    ['dump-store']: {
      description:
        'dumps store content to stdout as JSON, passes input forward',
      run: async (
        input: string | Readable,
        _args: string[]
      ): Promise<string | Readable> => {
        process.stdout.write(`${JSON.stringify(store, null, 2)}\n`);
        return input;
      },
    },
  },
};

export default plugin;
