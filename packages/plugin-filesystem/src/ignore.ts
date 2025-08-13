import { commandArgument, readableToString, type Arguments, type Commands, type IPluginRuntime } from '@or-q/lib';
import ignore from 'ignore';
import type { Readable } from 'node:stream';
import yaml from 'yaml';

const commands: Commands = {
  ignore: {
    description: 'filters a list of file and directory paths based on .gitignore-like filters',
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const usage = 'usage: ignore "patterns"';
      const patterns = await commandArgument(runtime, args.shift(), usage);
      const pathnames = yaml.parse(await readableToString(input));
      const result = ignore().add(patterns).filter(pathnames);
      return JSON.stringify(result, null, 2);
    },
  },
};

export default commands;
