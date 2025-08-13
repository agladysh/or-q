import { commandArgument, type Arguments, type Commands, type IPluginRuntime } from '@or-q/lib';
import { glob } from 'glob';
import type { Readable } from 'node:stream';

const commands: Commands = {
  glob: {
    description: 'replaces input with a list of files matching pattern in JSON',
    run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const usage = 'usage: glob "pattern" "ignore-pattern"';
      const pattern = await commandArgument(runtime, args.shift(), usage);
      const ignore = await commandArgument(runtime, args.shift(), usage);
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
    run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const usage = 'usage: glob "pattern" "ignore-pattern" "options"';

      // Lazy. Should validate schemas
      const patterns = JSON.parse(await commandArgument(runtime, args.shift(), usage));
      const ignores = JSON.parse(await commandArgument(runtime, args.shift(), usage));
      const options = JSON.parse(await commandArgument(runtime, args.shift(), usage));

      const entries = await glob(patterns, {
        ...options,
        ignore: ignores,
        cwd: process.cwd(),
        nodir: true,
      });
      return JSON.stringify(entries, null, 2);
    },
  },
};

export default commands;
