import { Readable } from 'node:stream';
import { fail, readableToString, type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

const plugin: Plugin = {
  name: pkg.name,
  commands: {
    ['-']: {
      description: 'read data from stdin, ignoring input',
      run: async (
        _input: string | Readable,
        _args: string[]
      ): Promise<string | Readable> => {
        return process.stdin;
      },
    },
    echo: {
      description: 'echoes trimmed argument to stdout, passing input forward',
      run: async (
        input: string | Readable,
        args: string[]
      ): Promise<string | Readable> => {
        const text = args.pop();
        // Lazy, this should be enforced by caller, including usage.
        if (text === undefined) {
          fail('usage: echo "<text>"');
        }
        process.stdout.write(`${text.trim()}\n`);
        return input;
      },
    },
    dump: {
      description: 'prints trimmed input to stdout, passes it along untrimmed',
      run: async (
        input: string | Readable,
        _args: string[]
      ): Promise<string | Readable> => {
        input = await readableToString(input);
        process.stdout.write(`${input.trim()}\n`);
        return input;
      },
    },
  },
};

export default plugin;
