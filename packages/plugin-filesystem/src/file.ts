import { readableToString, type Commands, type IProgram } from '@or-q/lib';
import { readFileSync } from 'node:fs';
import type { Readable } from 'node:stream';

const commands: Commands = {
  ['cat-file']: {
    description: 'replaces input with the file contents from argument',
    run: async (_input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: cat-file <filename>';
      const filename = await program.ensureNext(usage).toString();
      return readFileSync(filename, 'utf-8');
    },
  },
  ['file']: {
    description: 'converts input filename to the file contents',
    run: async (input: string | Readable, _program: IProgram): Promise<string | Readable> => {
      const filename = await readableToString(input);
      return readFileSync(filename, 'utf-8');
    },
  },
};

export default commands;
