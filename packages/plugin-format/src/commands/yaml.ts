import { readableToString, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import yaml from 'yaml';

const usage = 'usage: yaml';

const command: Command = {
  description: 'converts JSON to YAML',
  usage,
  tags: [],
  run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
    return yaml.stringify(JSON.parse(await readableToString(input)));
  },
};

export default command;
