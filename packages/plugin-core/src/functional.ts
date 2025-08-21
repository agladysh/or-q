import { type Arguments, commandArgument, type Commands, fail, type IPluginRuntime, readableToString } from '@or-q/lib';
import { Readable } from 'node:stream';
import parseArgsStringToArgv from 'string-argv';
import yaml from 'yaml';

const commands: Commands = {
  call: {
    description: 'calls command feeding it argument as input',
    run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const usage = 'usage: call "<command>" "<input>"';
      const command = await commandArgument(runtime, args.shift(), usage);
      const input = await commandArgument(runtime, args.shift(), usage);

      return runtime.runCommands(input, [command]);
    },
  },
  head: {
    description: 'returns first N items from the input array',
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const usage = 'usage: head N';
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
  },
  sort: {
    description: 'sorts input array',
    run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
      // Lazy. Should check schema.
      const data = yaml.parse(await readableToString(input)) as string[];
      return `${JSON.stringify(data.sort((lhs, rhs) => lhs.localeCompare(rhs)))}\n`;
    },
  },
  map: {
    description: 'applies commands from the argument to each entry of the input array, returns resulting array',
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      let arg = args.shift();
      if (arg === undefined) {
        return fail('usage: map [program]');
      }
      if (typeof arg === 'string') {
        arg = parseArgsStringToArgv(arg);
      }

      input = await readableToString(input);
      // Lazy. Should check schema.
      const data = yaml.parse(input) as string[];
      const result = [];
      for (const entry of data) {
        result.push(await readableToString(await runtime.runCommands(entry, arg.slice())));
      }
      return JSON.stringify(result, null, 2);
    },
  },
  // Lazy. Is there an idiomatic name for this?
  ['stream-map']: {
    description: 'applies commands from the argument to each entry of the input array, streaming to input',
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      let arg = args.shift();
      if (arg === undefined) {
        return fail('usage: stream-map [program]');
      }
      if (typeof arg === 'string') {
        arg = parseArgsStringToArgv(arg);
      }

      input = await readableToString(input);
      // Lazy. Should check schema.
      const data = yaml.parse(input) as string[];

      async function* stream(arg: Arguments) {
        for (const entry of data) {
          const result = await runtime.runCommands(entry, arg.slice());
          if (typeof result === 'string') {
            yield result;
            continue;
          }
          for await (const chunk of result) {
            yield chunk;
          }
        }
      }

      return Readable.from(stream(arg), { objectMode: true });
    },
  },
  ['map-n']: {
    description:
      'applies programs from the argument to each entry of the input array, returns resulting array of arrays',
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const usage = 'usage: map-n N [program1] ... [programN]';
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
          row.push(await readableToString(await runtime.runCommands(entry, program.slice())));
        }
        result.push(row);
      }
      return JSON.stringify(result, null, 2);
    },
  },
  // Lazy! TODO: DRY with map-n
  // Lazy! TODO: provide parallel-map
  ['parallel-map-n']: {
    description:
      'applies programs from the argument to each entry of the input array in parallel, returns resulting array of arrays',
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const usage = 'usage: parallel-map-n N [program1] ... [programN]';
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
              return runtime
                .clone()
                .runCommands(entry, program.slice())
                .then((r) => readableToString(r));
            })
          );
        })
      );

      return JSON.stringify(result, null, 2);
    },
  },
};

export default commands;
