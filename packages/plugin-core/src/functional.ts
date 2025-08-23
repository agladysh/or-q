import { type Commands, fail, type IProgram, readableToString } from '@or-q/lib';
import { Readable } from 'node:stream';
import yaml from 'yaml';

const commands: Commands = {
  call: {
    description: 'calls command feeding it argument as input',
    run: async (_input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: call [commands] "<input>"';
      const arg = await program.ensureNext(usage).toProgram();
      const input = await program.ensureNext(usage).toString();

      return arg.run(input);
    },
  },
  head: {
    description: 'returns first N items from the input array',
    run: async (input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: head N';
      const n = await program.ensureNext(usage).toNumber();
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
    run: async (input: string | Readable, _program: IProgram): Promise<string | Readable> => {
      // Lazy. Should check schema.
      const data = yaml.parse(await readableToString(input)) as string[];
      return `${JSON.stringify(data.sort((lhs, rhs) => lhs.localeCompare(rhs)))}\n`;
    },
  },
  map: {
    description: 'applies commands from the argument to each entry of the input array, returns resulting array',
    run: async (input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: map [program]';
      const arg = await program.ensureNext(usage).toProgram();

      input = await readableToString(input);
      // Lazy. Should check schema.
      const data = yaml.parse(input) as string[];
      const result = [];
      for (const entry of data) {
        result.push(await readableToString(await arg.run(entry)));
      }
      return JSON.stringify(result, null, 2);
    },
  },
  // Lazy. Is there an idiomatic name for this?
  ['stream-map']: {
    description: 'applies commands from the argument to each entry of the input array, streaming to input',
    run: async (input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: stream-map [program]';
      const arg = await program.ensureNext(usage).toProgram();

      input = await readableToString(input);
      // Lazy. Should check schema.
      const data = yaml.parse(input) as string[];

      async function* stream(arg: IProgram) {
        for (const entry of data) {
          const result = await arg.clone().run(entry);
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
    run: async (input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: map-n N [program1] ... [programN]';
      const n = await program.ensureNext(usage).toNumber();
      if (!Number.isInteger(n) || n < 1) {
        return fail(usage);
      }
      if (n === 1) {
        return input;
      }

      const programs = [];
      for (let i = 0; i < n; ++i) {
        programs.push(await program.ensureNext(usage).toProgram());
      }

      input = await readableToString(input);
      // Lazy. Should check schema.
      const data = JSON.parse(input) as string[];
      const result = [];
      for (const entry of data) {
        const row = [];
        for (const program of programs) {
          row.push(await readableToString(await program.run(entry)));
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
    run: async (input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: parallel-map-n N [program1] ... [programN]';
      const n = await program.ensureNext(usage).toNumber();
      if (!Number.isInteger(n) || n < 1) {
        return fail(usage);
      }
      if (n === 1) {
        return input;
      }

      const programs: IProgram[] = [];
      for (let i = 0; i < n; ++i) {
        programs.push(await program.ensureNext(usage).toProgram());
      }

      // Lazy. Should check schema.
      const data = yaml.parse(await readableToString(input)) as string[];

      const result = await Promise.all(
        data.map((entry) => {
          return Promise.all(
            programs.map(async (program) => {
              // Running in throw-away clone to prevent async races
              // Lazy. Least surprise principle violated, this silently loses any updates to scopes, e.g. storage.
              //       Is there a reasonable way possible to provide scope reintegration functionality for the Storage plugin?
              //       Perhaps users doing store-{push,pop} commands manually will help somehow? (It is ok, since our commands are so low-level)
              const r = await program.cloneWithRuntime().run(entry);
              return readableToString(r);
            })
          );
        })
      );

      return JSON.stringify(result, null, 2);
    },
  },
};

export default commands;
