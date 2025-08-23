import { readableToString, type Commands, type IProgram } from '@or-q/lib';
import type { Readable } from 'node:stream';

const commands: Commands = {
  unquote: {
    description: 'unquotes input JSON string (useful in conjunction with jp)',
    run: async (input: string | Readable, _program: IProgram): Promise<string | Readable> => {
      input = await readableToString(input);
      return JSON.parse(input);
    },
  },
  quote: {
    description: 'quotes input to JSON string',
    run: async (input: string | Readable, _program: IProgram): Promise<string | Readable> => {
      input = await readableToString(input);
      return JSON.stringify(input);
    },
  },
  replace: {
    description: 'replaces substring with new string in input',
    run: async (input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = `usage: replace "<from>" "<to>"`;
      const from = await program.ensureNext(usage).toString();
      const to = await program.ensureNext(usage).toString();
      input = await readableToString(input);
      return input.replaceAll(from, to);
    },
  },
  trim: {
    description: 'trims input',
    run: async (input: string | Readable, _program: IProgram): Promise<string | Readable> => {
      input = await readableToString(input);
      return input.trim();
    },
  },
  trimStart: {
    description: 'trims input start',
    run: async (input: string | Readable, _program: IProgram): Promise<string | Readable> => {
      input = await readableToString(input);
      return input.trimStart();
    },
  },
  trimEnd: {
    description: 'trims input end',
    run: async (input: string | Readable, _program: IProgram): Promise<string | Readable> => {
      input = await readableToString(input);
      return input.trimEnd();
    },
  },
};

export default commands;
