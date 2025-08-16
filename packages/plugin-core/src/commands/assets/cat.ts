import {
  assetGlob,
  fail,
  resolveAsset,
  type IPluginRuntime,
  type Command,
  type Arguments,
  commandArgument,
} from '@or-q/lib';
import type { Readable } from 'node:stream';

const usage = 'usage: cat "<file>"';

const command: Command = {
  description: 'replaces input with file or asset',
  usage,
  tags: ['io'],
  run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const uri = await commandArgument(runtime, args.shift(), usage);

    let text = resolveAsset(runtime, uri);
    if (text === undefined) {
      // Unqualified URIs are loaded from plugins.
      // Use dot notation (./dir/filename.yaml) or an absolute path (/path/to/filename.yaml) to load from filesystem
      // Lazy. This will likely fail on Windows. Normalize plugin path separators on ingestion.
      const assetNames = assetGlob(runtime, `plugin:*/**/${uri}`).sort();
      const assetName = assetNames[0]; // We handle not found below.
      text = runtime.assets[assetName];
      if (assetNames.length > 1) {
        process.emitWarning(
          `cat: several assets found for "${uri}":\n* ${assetNames.join('\n* ')}\nUsing "${assetName}"`
        );
      }
    }

    if (text === undefined) {
      return fail(`cat: "${uri}" not found, did you mean "./${uri}?`);
    }

    return text;
  },
};

export default command;
