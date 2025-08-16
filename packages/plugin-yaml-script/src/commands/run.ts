import {
  assetGlob,
  commandArgument,
  fail,
  resolveAsset,
  type Arguments,
  type Command,
  type IPluginRuntime,
} from '@or-q/lib';
import type { Readable } from 'node:stream';
import { runYAMLScript } from '../utils.ts';

const usage = 'usage: run "<file>"';

const command: Command = {
  description: 'runs YAML script file from file: or plugin:',
  usage,
  tags: [],
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const uri = await commandArgument(runtime, args.shift(), usage);

    let yamlString = resolveAsset(runtime, uri);
    if (yamlString === undefined) {
      // Unqualified URIs are loaded from plugins.
      // Use dot notation (./dir/filename.yaml) or an absolute path (/path/to/filename.yaml) to load from filesystem
      // Lazy. This will likely fail on Windows. Normalize plugin path separators on ingestion.
      const assetNames = assetGlob(runtime, `plugin:*/**/scripts/**/${uri}.yaml`).sort();
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
};

export default command;
