import type { IProgram, Commands } from '@or-q/lib';
import type { Readable } from 'node:stream';

const commands: Commands = {
  dump: {
    description: 'replaces input with remaining program dump',
    run: async (_input: string | Readable, program: IProgram): Promise<string | Readable> => {
      return `${program.cloneRemaining().toJSON()}\n`;
    },
  },
  rem: {
    description: 'consumes all remaining arguments and replaces input with them in JSON',
    run: async (_input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const result = program.cloneRemaining().toJSON();
      program.rem();
      return `${result}\n`;
    },
  },
};

export default commands;
