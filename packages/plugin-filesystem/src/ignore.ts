import { type IProgram, readableToString, type Commands } from '@or-q/lib';
import ignore from 'ignore';
import type { Readable } from 'node:stream';
import yaml from 'yaml';

const commands: Commands = {
  ignore: {
    description: 'filters a list of file and directory paths based on .gitignore-like filters',
    run: async (input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: ignore "patterns"';
      const patterns = await program.ensureNext(usage).toString();
      const pathnames = yaml.parse(await readableToString(input));
      const result = ignore().add(patterns).filter(pathnames);
      return JSON.stringify(result, null, 2);
    },
  },
};

export default commands;
