import { type Arguments, commandArgument, fail, type IPluginRuntime, type Plugin } from '@or-q/lib';
import type { Readable } from 'node:stream';
import pkg from '../package.json' with { type: 'json' };

const contextID = `context:${pkg.name}:store`;

type Store = Record<string, string | Readable>;

function getStore(runtime: IPluginRuntime): Store {
  let result = runtime.getContext<Store>(contextID);
  if (result !== undefined) {
    return result;
  }
  result = {};
  runtime.pushContext<Store>(contextID, result);
  return result;
}

const plugin: Plugin = {
  name: pkg.name,
  commands: {
    load: {
      description: 'loads a named value from the store, replacing input with it, unknown values are empty strings',
      run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
        const key = await commandArgument(runtime, args.shift(), 'usage: load "<text>"');
        return getStore(runtime)[key] ?? '';
      },
    },
    save: {
      description: 'saves input into a named value of the store, passes input along',
      run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
        const key = await commandArgument(runtime, args.shift(), 'usage: save "<key>"');
        getStore(runtime)[key] = input; // Should we read Readable?
        return input;
      },
    },
    set: {
      description: 'sets key to value in store, forwards input',
      run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
        const usage = 'usage: set "<key>" "<value>"';
        const key = await commandArgument(runtime, args.shift(), usage);
        const value = await commandArgument(runtime, args.shift(), usage);
        getStore(runtime)[key] = value;
        return input;
      },
    },
    // Lazy. Formally, it is not possible to get data from arguments.
    setdata: {
      description: 'sets key to value in store, treating value as data and serializing it to JSON, forwards input',
      run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
        const usage = 'usage: setdata "<key>" "<value>"';
        const key = await commandArgument(runtime, args.shift(), usage);
        const value = args.shift();
        if (value === undefined) {
          return fail(usage);
        }
        getStore(runtime)[key] = JSON.stringify(value);
        return input;
      },
    },
    ['dump-store']: {
      description: 'dumps store content to stdout as JSON, passes input forward',
      run: async (input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
        process.stdout.write(`${JSON.stringify(getStore(runtime), null, 2)}\n`);
        return input;
      },
    },
  },
};

export default plugin;
