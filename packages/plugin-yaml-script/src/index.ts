import {
  assetGlob,
  fail,
  resolveAsset,
  type IPluginRuntime,
  type Plugin,
} from '@or-q/lib';
import type { Readable } from 'node:stream';
import yaml from 'yaml';

import { parse } from 'node:path';
import pkg from '../package.json' with { type: 'json' };

interface Script {
  // Lazy. Replace with more ergonomic design once plugin command arguments have proper schemas!
  commands: [[string, string]];
}

async function runYAMLScript(
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
      description: 'executes YAML script from argument',
      run: async (
        input: string | Readable,
        args: string[],
        runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        const yamlString = args.shift();
        // Lazy, this should be enforced by caller, including usage.
        if (yamlString === undefined) {
          fail(
            'usage: exec "<yaml>", you may use run <(cat filename.yaml) to read from file'
          );
        }

        return runYAMLScript(input, yamlString, runtime);
      },
    },
    ['list-script-assets']: {
      description:
        'prints the list of available builtin scripts to stdout, passes input along',
      run: async (
        input: string | Readable,
        _args: string[],
        runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        // Lazy. Sort by name, so duplicates are clearly visible.
        const assetNames = assetGlob(runtime, `**/scripts/**/*.yaml`).sort();
        process.stdout.write(
          `Available script assets:\n\n${assetNames.map((a) => `* ${parse(a).name}\t${a}`).join('\n')}\n\n`
        );
        return input;
      },
    },
    run: {
      description: 'runs YAML script file from file: or plugin:',
      run: async (
        input: string | Readable,
        args: string[],
        runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        // Lazy. This is copy-pasted in several places with minor changes. Generalize.
        const uri = args.shift();
        // Lazy, this should be enforced by caller, including usage.
        if (uri === undefined) {
          // Lazy. Document uri schemas and resolution logic better
          return fail('usage: run "<file>"');
        }

        let yamlString = resolveAsset(runtime, uri);
        if (yamlString === undefined) {
          // Unqualified URIs are loaded from plugins.
          // Use dot notation (./dir/filename.yaml) or an absolute path (/path/to/filename.yaml) to load from filesystem
          // Lazy. This will likely fail on Windows. Normalize plugin path separators on ingestion.
          const assetNames = assetGlob(
            runtime,
            `plugin:*/**/scripts/**/${uri}.yaml`
          ).sort();
          const assetName = assetNames[0]; // We handle not found below.
          yamlString = runtime.assets[assetName];
          if (assetNames.length > 1) {
            process.emitWarning(
              `run: several scripts found for "${uri}":\n* ${assetNames.join('\n* ')}\nUsing "${assetName}"`
            );
          }
        }

        if (yamlString === undefined) {
          return fail(`run: "${uri}" not found, did you mean "./${uri}?"`);
        }

        return runYAMLScript(input, yamlString, runtime);
      },
    },
  },
};

export default plugin;
