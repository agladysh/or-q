import type { IProgram, Commands } from '@or-q/lib';
import type { Readable } from 'node:stream';

const commands: Commands = {
  ['list-plugins']: {
    description: 'prints the list of available plugins to stdout, passes input along',
    run: async (input: string | Readable, program: IProgram): Promise<string | Readable> => {
      process.stdout.write(`Available plugins:\n\n${program.runtime.pluginNames.join('\n')}\n\n`);
      return input;
    },
  },
  ['plugins-json']: {
    description: 'replaces input with a full information on available plugins',
    run: async (_input: string | Readable, program: IProgram): Promise<string | Readable> => {
      return `${JSON.stringify(program.runtime.plugins)}\n`;
    },
  },
};

export default commands;
