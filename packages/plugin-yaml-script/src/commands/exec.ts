import { commandArgument, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import { runYAMLScript } from '../utils.ts';

const usage = 'usage: exec "<yaml>", you may use run <(cat filename.yaml) to read from file';

const command: Command = {
  description: 'executes YAML script from argument',
  usage,
  tags: [],
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const yamlString = await commandArgument(runtime, args.shift(), usage);
    return runYAMLScript(input, yamlString, runtime);
  },
};

export default command;
