import type { Commands, IProgram } from '@or-q/lib';
import type { Readable } from 'node:stream';

const commands: Commands = {
  secret: {
    description: 'replaces input with a secret',
    // Lazy. Protect the secret from exposure e.g. in logs.
    run: async (_input: string | Readable, program: IProgram): Promise<string | Readable> => {
      const usage = 'usage: secret "<id>"';
      const id = await program.ensureNext(usage).toString();
      return process.env[id] ?? '';
    },
  },
};

export default commands;
