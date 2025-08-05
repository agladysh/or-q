import { fail, type IPluginRuntime, type Plugin } from '@or-q/lib';
import { Readable } from 'node:stream';
import yaml from 'yaml';

import pkg from '../package.json' with { type: 'json' };

interface Script {
  commands: [[string, string]];
}

async function runScript(
  input: string | Readable,
  yamlString: string,
  runtime: IPluginRuntime
): Promise<string | Readable> {
  // Lazy: Validate schema with arktype
  const data = yaml.parse(yamlString) as Script;
  return runtime.runCommands(
    input,
    data.commands.flatMap((a) => a)
  );
}

const plugin: Plugin = {
  name: pkg.name,
  commands: {
    exec: {
      description: 'executes YAML script',
      run: async (
        input: string | Readable,
        args: string[],
        runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        const yamlString = args.pop();
        // Lazy, this should be enforced by caller, including usage.
        if (yamlString === undefined) {
          // Lazy. Provide run to run from file.
          fail(
            'usage: exec "<yaml>", you may use run <(cat filename.yaml) to read from file'
          );
        }

        return runScript(input, yamlString, runtime);
      },
    },
  },
};

export default plugin;
