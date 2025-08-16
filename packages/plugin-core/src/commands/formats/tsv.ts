import { type Arguments, readableToString, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import yaml from 'yaml';

const command: Command = {
  description: 'converts input JSON or YAML array of arrays to TSV',
  usage: 'usage: tsv',
  tags: ['data'],
  run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
    // Lazy. Very fragile. Use a real library.
    input = await readableToString(input);
    const data = yaml.parse(input) as Array<string>[][];
    return data.map((row) => `${row.join('\t')}`).join('\n');
  },
};

export default command;
