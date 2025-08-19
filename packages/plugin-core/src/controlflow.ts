import { commandArgument, fail, readableToString, type Arguments, type Commands, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import parseArgsStringToArgv from 'string-argv';

// Lazy. Experimental. Questionable DX.
const commands: Commands = {
  equals: {
    description: 'replaces input with `true` if arguments are equal, with `false` otherwise',
    run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const usage = 'usage: equals "<lhs>" "<rhs>"';
      const lhs = await readableToString(await commandArgument(runtime, args.shift(), usage));
      const rhs = await readableToString(await commandArgument(runtime, args.shift(), usage));
      return String(lhs === rhs);
    },
  },
  then: {
    description: 'runs commands only if trimmed input is `true`',
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const usage = 'usage: then ["<commands>"]';
      let arg = args.shift();
      if (arg === undefined) {
        return fail(usage);
      }
      if (typeof arg === 'string') {
        arg = parseArgsStringToArgv(arg);
      }

      input = await readableToString(input);
      if (input.trim() !== 'true') {
        return input;
      }

      return runtime.runCommands(input, arg.slice());
    },
  },
  else: {
    description: 'runs commands only if trimmed input is NOT `true`',
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const usage = 'usage: else ["<commands>"]';
      let arg = args.shift();
      if (arg === undefined) {
        return fail(usage);
      }
      if (typeof arg === 'string') {
        arg = parseArgsStringToArgv(arg);
      }

      input = await readableToString(input);
      if (input.trim() === 'true') {
        return input;
      }

      return runtime.runCommands(input, arg.slice());
    },
  },
};

export default commands;
