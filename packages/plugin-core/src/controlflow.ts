import { readableToString, type Commands, type IProgram } from '@or-q/lib';
import type { Readable } from 'node:stream';

// Lazy. Experimental. Questionable DX.
const commands: Commands = {
  equals: {
    description: 'replaces input with `true` if arguments are equal, with `false` otherwise',
    run: async (_input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: equals "<lhs>" "<rhs>"';
      const lhs = await program.ensureNext(usage).toString();
      const rhs = await program.ensureNext(usage).toString();
      return String(lhs === rhs);
    },
  },
  matches: {
    description: 'replaces input with `true` if input matches the argument, with `false` otherwise',
    run: async (input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: echo "<input>" matches "<pattern>"';
      const pattern = await program.ensureNext(usage).toString();
      return String(new RegExp(pattern).test(await readableToString(input)));
    },
  },
  contains: {
    description: 'replaces input with `true` if input contains the argument, with `false` otherwise',
    run: async (input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: echo "<input>" contains "<substring>"';
      const pattern = await program.ensureNext(usage).toString();
      return String((await readableToString(input)).includes(pattern));
    },
  },
  then: {
    description: 'runs commands only if trimmed input is `true`',
    run: async (input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: then ["<commands>"]';
      const arg = await program.ensureNext(usage).toProgram();

      input = await readableToString(input);
      if (input.trim() !== 'true') {
        return input;
      }

      return arg.run(input);
    },
  },
  else: {
    description: 'runs commands only if trimmed input is NOT `true`',
    run: async (input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: else ["<commands>"]';
      const arg = await program.ensureNext(usage).toProgram();

      input = await readableToString(input);
      if (input.trim() === 'true') {
        return input;
      }

      return arg.run(input);
    },
  },
  ['if-then']: {
    description:
      'runs commands from the second argument only if the first argument is `true`, passes input to both arguments',
    run: async (input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: if-then ["<commands">] ["<commands>"]';
      const condition = await program.ensureNext(usage).toProgram();
      const commands = await program.ensureNext(usage).toProgram(); // We must consume commands regardless of condition

      input = await readableToString(input); // Reading input to preserve stream content

      const flag = await readableToString(await condition.run(input));
      if (flag.trim() === 'true') {
        return commands.run(input);
      }

      return input;
    },
  },
};

export default commands;
