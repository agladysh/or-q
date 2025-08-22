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
  matches: {
    description: 'replaces input with `true` if input matches the argument, with `false` otherwise',
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const usage = 'usage: echo "<input>" matches "<pattern>"';
      const pattern = await readableToString(await commandArgument(runtime, args.shift(), usage));
      return String(new RegExp(pattern).test(await readableToString(input)));
    },
  },
  contains: {
    description: 'replaces input with `true` if input contains the argument, with `false` otherwise',
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const usage = 'usage: echo "<input>" contains "<substring>"';
      const pattern = await readableToString(await commandArgument(runtime, args.shift(), usage));
      return String((await readableToString(input)).includes(pattern));
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
  ['if-then']: {
    description:
      'runs commands from the second argument only if the first argument is `true`, passes input to both arguments',
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const usage = 'usage: if-then ["<commands">] ["<commands>"]';
      let condition = args.shift();
      if (condition === undefined) {
        return fail(usage);
      }
      if (typeof condition === 'string') {
        condition = parseArgsStringToArgv(condition);
      }

      let commands = args.shift(); // We must consume commands regardless of condition
      if (commands === undefined) {
        return fail(usage);
      }
      if (typeof commands === 'string') {
        commands = parseArgsStringToArgv(commands);
      }

      input = await readableToString(input); // Reading input to preserve stream content

      const flag = await readableToString(await runtime.runCommands(input, condition.slice()));
      if (flag.trim() === 'true') {
        return runtime.runCommands(input, commands.slice());
      }

      return input;
    },
  },
};

export default commands;
