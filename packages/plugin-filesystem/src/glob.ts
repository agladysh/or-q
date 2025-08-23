import { type Commands, type IProgram } from '@or-q/lib';
import { glob, type GlobOptions } from 'glob';
import type { Readable } from 'node:stream';

const commands: Commands = {
  glob: {
    description: 'replaces input with a list of files matching pattern in JSON',
    run: async (_input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: glob "pattern" "ignore-pattern"';
      const pattern = await program.ensureNext(usage).toString();
      const ignore = await program.ensureNext(usage).toString();
      const entries = await glob(pattern, {
        ignore: ignore,
        cwd: process.cwd(),
        nodir: true,
      });
      return JSON.stringify(entries, null, 2);
    },
  },
  glob3: {
    description: 'replaces input with a list of files matching pattern in JSON, accepts arguments as JSON values',
    run: async (_input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: glob "pattern" "ignore-pattern" "options"';

      // Lazy. Should validate schemas
      const patterns = await program.ensureNext(usage).toObject<string | string[]>();
      const ignores = await program.ensureNext(usage).toObject<string[]>();
      const options = await program.ensureNext(usage).toObject<GlobOptions>();

      const entries = await glob(patterns, {
        ...options,
        ignore: ignores,
        cwd: process.cwd(),
        nodir: options.nodir ?? true,
      });
      return JSON.stringify(entries, null, 2);
    },
  },
};

export default commands;
