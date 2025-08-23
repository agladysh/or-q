import { readableToString, type Commands, type IProgram } from '@or-q/lib';
import { createInterface } from 'node:readline/promises';
import type { Readable } from 'node:stream';

const commands: Commands = {
  ['-']: {
    description: 'read data from stdin, ignoring input',
    run: async (_input: string | Readable, _program: IProgram): Promise<string | Readable> => {
      return process.stdin;
    },
  },
  // Lazy. This should not trim. Instead define trim, trim-start and trim-end commands in string.ts.
  print: {
    description: 'prints trimmed argument to stdout, passing input forward',
    run: async (input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: print "<text>"';
      const text = await program.ensureNext(usage).toString();
      process.stdout.write(`${text.trim()}\n`);
      return input;
    },
  },
  // Lazy. This is not tee. Rename. Tee must write to a file.
  tee: {
    description: 'outputs end-trimmed input to stdout, passes it along untrimmed',
    run: async (input: string | Readable, _program: IProgram): Promise<string | Readable> => {
      input = await readableToString(input);
      process.stdout.write(`${input.trimEnd()}\n`);
      return input;
    },
  },
  echo: {
    description: 'replaces input with argument',
    run: async (_input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: echo "<text>"';
      return program.ensureNext(usage).toString();
    },
  },
  default: {
    description: 'if input is empty, replaces it with argument',
    run: async (input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: default "<text>"';
      const text = await program.ensureNext(usage).toString();
      input = await readableToString(input);
      return input === '' ? text : input;
    },
  },
  clear: {
    description: 'replaces input with empty string',
    run: async (_input: string | Readable, _program: IProgram): Promise<string | Readable> => {
      return '';
    },
  },
  readline: {
    description: 'replaces input with a line from stdin',
    run: async (_input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: readline "<prompt>"';
      const isRaw = process.stdin.isRaw;
      const readline = createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const prompt = await program.ensureNext(usage).toString();
      const answer = await readline.question(prompt);

      readline.close();

      process.stdin.setRawMode?.(isRaw);
      process.stdin.resume();

      return answer;
    },
  },
};

export default commands;
