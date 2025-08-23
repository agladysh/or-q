import { type IProgram, readableToString, type Commands } from '@or-q/lib';
import type { Readable } from 'node:stream';

const commands: Commands = {
  prepend: {
    description: 'prepends argument to input, does NOT insert a newline at either end of argument',
    run: async (input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const text = await program.ensureNext('usage: prepend "\n<text>\n"').toString();
      input = await readableToString(input);
      return `${text}${input}`;
    },
  },
  append: {
    description: 'appends argument to input, does NOT insert a newline at either end of argument',
    run: async (input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const text = await program.ensureNext('usage: append "\n<text>\n"').toString();
      input = await readableToString(input);
      return `${input}${text}`;
    },
  },
  input: {
    description: 'forwards input (useful for program arguments sometimes)',
    run: async (input: string | Readable, _program: IProgram): Promise<string | Readable> => {
      // Lazy. We read from the stream to prevent cli from skipping the output. Which is too weird. Perhaps cli should not print anything by itself at all?
      return readableToString(input);
    },
  },
};

export default commands;
