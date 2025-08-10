import {
  type Arguments,
  commandArgument,
  fail,
  type IPluginRuntime,
  type Plugin,
  runCommandsInContext,
} from '@or-q/lib';
import type { Readable } from 'node:stream';
import yaml from 'yaml';
import pkg from '../package.json' with { type: 'json' };

type Defs = Record<string, Arguments>;

const macros: Defs = {};

const contextID = `context:${pkg.name}:$macro`;
type Context = { args: Arguments };

const plugin: Plugin = {
  name: pkg.name,
  commands: {
    $defmacro: {
      description: 'stores or overrides a macro definition, forwards input',
      run: async (
        input: string | Readable,
        args: Arguments,
        runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        const usage = 'usage: $defmacro <name> <def>';
        const name = await commandArgument(runtime, args.shift(), usage);
        const defArg = args.shift();
        if (defArg === undefined) {
          return fail(usage);
        }
        // Lazy. Must check schema.
        const def = (
          typeof defArg === 'string' ? yaml.parse(defArg) : defArg
        ) as Arguments;
        if (macros[name]) {
          // Lazy. This should have asset-like name resolution instead.
          return fail(`duplicate macro definition ${name}`);
        }
        macros[name] = def;

        return input;
      },
    },
    $macro: {
      description: 'invokes macro',
      run: async (
        input: string | Readable,
        args: Arguments,
        runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        const usage = 'usage: $macro [<macro>, ...args]';
        const arg = args.shift();
        if (arg === undefined) {
          return fail(usage);
        }
        const invocation = (
          typeof arg === 'string' ? yaml.parse(arg) : arg
        ) as Arguments;
        if (invocation.length < 1) {
          return fail(usage);
        }
        const name = await commandArgument(
          runtime,
          invocation[0],
          'internal error: unreachable'
        );
        const def = macros[name];
        if (!def) {
          return fail(`unknown macro "${name}"`);
        }

        const resolved: Arguments = [];
        for (const arg of invocation) {
          resolved.push(
            await commandArgument(runtime, arg, 'internal error: unreachable')
          );
        }

        // Lazy. Do proper deep clone instead of JSON serialization.
        return await runCommandsInContext<Context>(
          runtime,
          input,
          JSON.parse(JSON.stringify(def)),
          contextID,
          { args: resolved }
        );
      },
    },
    $arg: {
      description: 'macro argument placeholder',
      run: async (
        _input: string | Readable,
        args: Arguments,
        runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        const usage = 'usage: $arg <n>';
        const argStr = await commandArgument(runtime, args.shift(), usage);
        const argno = Number(argStr);
        if (!Number.isInteger(argno)) {
          return fail(usage);
        }

        const context = runtime.getContext<Context>(contextID);
        if (!context) {
          return fail(
            'attempted to run $arg command outside of $macro command context'
          );
        }

        return await commandArgument(
          runtime,
          context.args[argno],
          `no $arg number ${argno} found in ${JSON.stringify(args)}`
        );
      },
    },
    ['dump-macros']: {
      description: 'replaces input with macros saved as JSON',
      run: async (
        input: string | Readable,
        _args: Arguments,
        _runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        process.stdout.write(`${JSON.stringify(macros, null, 2)}\n`);
        return input;
      },
    },
  },
};

export default plugin;
