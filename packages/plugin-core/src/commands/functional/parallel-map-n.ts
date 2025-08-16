import { type Arguments, commandArgument, type Command, fail, type IPluginRuntime, readableToString } from '@or-q/lib';
import type { Readable } from 'node:stream';
import parseArgsStringToArgv from 'string-argv';
import yaml from 'yaml';

const usage = 'usage: parallel-map-n N [program1] ... [programN]';

const command: Command = {
  description:
    'applies programs from the argument to each entry of the input array in parallel, returns resulting array of arrays',
  usage,
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const nStr = await commandArgument(runtime, args.shift(), usage);
    const n = Number(nStr);
    if (!Number.isInteger(n) || n < 1 || n > args.length) {
      return fail(usage);
    }
    if (n === 1) {
      return input;
    }

    const programs: Arguments[] = [];
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

    // Lazy. Should check schema.
    const data = yaml.parse(await readableToString(input)) as string[];

    const result = await Promise.all(
      data.map((entry) => {
        return Promise.all(
          programs.map((program) => {
            // Running in throw-away clone to prevent async races
            // Lazy. Least surprise principle violated, this silently loses any updates to scopes, e.g. storage.
            //       Is there a reasonable way possible to provide scope reintegration functionality for the Storage plugin?
            //       Perhaps users doing store-{push,pop} commands manually will help somehow? (It is ok, since our commands are so low-level)
            return runtime.clone().runCommands(entry, program.slice());
          })
        );
      })
    );

    return JSON.stringify(result, null, 2);
  },
};

export default command;
