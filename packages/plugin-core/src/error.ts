import { type IProgram, type Commands, fail } from '@or-q/lib';
import type { Readable } from 'node:stream';

const commands: Commands = {
  fail: {
    description: 'fails with an error message',
    run: async (_input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const message = (await program.ensureNext('usage: fail "<message>"').toString()).trim();
      return fail(message === '' ? 'fail: no error message provided' : message);
    },
  },
};

export default commands;
