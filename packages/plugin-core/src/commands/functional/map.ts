import { type Arguments, type Command, fail, type IPluginRuntime, readableToString } from '@or-q/lib';
import type { Readable } from 'node:stream';
import parseArgsStringToArgv from 'string-argv';
import yaml from 'yaml';

const usage = 'usage: map [program]';

const command: Command = {
  description: 'applies commands from the argument to each entry of the input array, returns resulting array',
  usage,
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    let arg = args.shift();
    if (arg === undefined) {
      return fail(usage);
    }
    if (typeof arg === 'string') {
      arg = parseArgsStringToArgv(arg);
    }

    input = await readableToString(input);
    // Lazy. Should check schema.
    const data = yaml.parse(input) as string[];
    const result = [];
    for (const entry of data) {
      result.push(await runtime.runCommands(entry, arg.slice()));
    }
    return JSON.stringify(result, null, 2);
  },
};

export default command;
