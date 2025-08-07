import {
  type Arguments,
  readableToString,
  type Commands,
  type IPluginRuntime,
} from '@or-q/lib';
import type { Readable } from 'node:stream';
import yaml from 'yaml';

const commands: Commands = {
  tsv: {
    description: 'converts input JSON or YAML array of arrays to TSV',
    run: async (
      input: string | Readable,
      _args: Arguments,
      _runtime: IPluginRuntime
    ): Promise<string | Readable> => {
      // Lazy. Very fragile. Use a real library.
      input = await readableToString(input);
      const data = yaml.parse(input) as Array<string>[][];
      return data.map((row) => `${row.join('\t')}`).join('\n');
    },
  },
};

export default commands;
