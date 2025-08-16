import { type Arguments, commandArgument, type Command, fail, type IPluginRuntime, readableToString } from '@or-q/lib';
import type { Readable } from 'node:stream';
import parseArgsStringToArgv from 'string-argv';

const usage = 'usage: map-n N [program1] ... [programN]';

const command: Command = {
  description: 'applies programs from the argument to each entry of the input array, returns resulting array of arrays',
  usage,
  tags: ['data'],
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const nStr = await commandArgument(runtime, args.shift(), usage);
    const n = Number(nStr);
    if (!Number.isInteger(n) || n < 1 || n > args.length) {
      return fail(usage);
    }
    if (n === 1) {
      return input;
    }

    const programs = [];
    for (let i = 0; i < n; ++i) {
      let arg = args.shift();
      if (arg === undefined) {
        return fail(usage);
      }
      if (typeof arg === 'string') {
        arg = parseArgsStringToArgv(arg);
      }
      programs.push(arg);
    }

    input = await readableToString(input);
    // Lazy. Should check schema.
    const data = JSON.parse(input) as string[];
    const result = [];
    for (const entry of data) {
      const row = [];
      for (const program of programs) {
        row.push(await runtime.runCommands(entry, program.slice()));
      }
      result.push(row);
    }
    return JSON.stringify(result, null, 2);
  },
};

export default command;
