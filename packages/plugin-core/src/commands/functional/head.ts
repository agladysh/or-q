import { type Arguments, commandArgument, type Command, fail, type IPluginRuntime, readableToString } from '@or-q/lib';
import type { Readable } from 'node:stream';
import yaml from 'yaml';

const usage = 'usage: head N';

const command: Command = {
  description: 'returns first N items from the input array',
  usage,
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const nStr = await commandArgument(runtime, args.shift(), usage);
    const n = Number(nStr);
    if (!Number.isInteger(n) || n < 0) {
      return fail(usage);
    }
    if (n === 0) {
      return input;
    }

    input = await readableToString(input);
    // Lazy. Should check schema.
    const data = yaml.parse(input) as string[];
    const result = data.slice(0, n);
    return JSON.stringify(result, null, 2);
  },
};

export default command;
