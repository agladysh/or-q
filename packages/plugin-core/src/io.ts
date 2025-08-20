import { commandArgument, readableToString, type Arguments, type Commands, type IPluginRuntime } from '@or-q/lib';
import { createInterface } from 'node:readline/promises';
import type { Readable } from 'node:stream';

const commands: Commands = {
  ['-']: {
    description: 'read data from stdin, ignoring input',
    run: async (_input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
      return process.stdin;
    },
  },
  // Lazy. This should not trim. Instead define trim, trim-start and trim-end commands in string.ts.
  print: {
    description: 'prints trimmed argument to stdout, passing input forward',
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const text = await commandArgument(runtime, args.shift(), 'usage: log "<text>"');
      process.stdout.write(`${text.trim()}\n`);
      return input;
    },
  },
  // Lazy. This is not tee. Rename. Tee must write to a file.
  tee: {
    description: 'outputs end-trimmed input to stdout, passes it along untrimmed',
    run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
      input = await readableToString(input);
      process.stdout.write(`${input.trimEnd()}\n`);
      return input;
    },
  },
  echo: {
    description: 'replaces input with argument',
    run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      return await commandArgument(runtime, args.shift(), 'usage: echo "<text>"');
    },
  },
  default: {
    description: 'if input is empty, replaces it with argument',
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const text = await commandArgument(runtime, args.shift(), 'usage: default "<text>"');
      input = await readableToString(input);
      return input === '' ? text : input;
    },
  },
  clear: {
    description: 'replaces input with empty string',
    run: async (_input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
      return '';
    },
  },
  readline: {
    description: 'replaces input with a line from stdin',
    run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const readline = createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const prompt = await commandArgument(runtime, args.shift(), 'usage: readline "<prompt>"');
      const answer = await readline.question(prompt);
      readline.close();
      return answer;
    },
  },
};

export default commands;
