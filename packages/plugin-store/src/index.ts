import {
  type Arguments,
  commandArgument,
  type IPluginRuntime,
  type Plugin,
} from '@or-q/lib';
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
        args: Arguments,
        runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        const key = await commandArgument(
          runtime,
          args.shift(),
          'usage: load "<text>"'
        );
        return store[key] ?? '';
      },
    },
    save: {
      description:
        'saves input into a named value of the store, passes input along',
      run: async (
        input: string | Readable,
        args: Arguments,
        runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        const key = await commandArgument(
          runtime,
          args.shift(),
          'usage: save "<key>"'
        );
        store[key] = input; // Should we read Readable?
        return input;
      },
    },
    set: {
      description: 'sets key to value in store, forwards input',
      run: async (
        input: string | Readable,
        args: Arguments,
        runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        const usage = 'usage: set "<key>" "<value>"';
        const key = await commandArgument(runtime, args.shift(), usage);
        const value = await commandArgument(runtime, args.shift(), usage);
        store[key] = value;
        return input;
      },
    },
    ['dump-store']: {
      description:
        'dumps store content to stdout as JSON, passes input forward',
      run: async (
        input: string | Readable,
        _args: Arguments,
        _runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        process.stdout.write(`${JSON.stringify(store, null, 2)}\n`);
        return input;
      },
    },
  },
};

export default plugin;
