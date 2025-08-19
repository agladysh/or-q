import {
  assetGlob,
  fail,
  resolveAsset,
  type IPluginRuntime,
  type Commands,
  type Arguments,
  commandArgument,
  readableToString,
} from '@or-q/lib';
import { basename } from 'node:path';
import type { Readable } from 'node:stream';

const commands: Commands = {
  ['list-assets']: {
    description: 'prints the list of available assets to stdout, passes input along',
    run: async (input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      // Lazy. Sort by name, so duplicates are clearly visible.
      process.stdout.write(
        `Available assets:\n\n${runtime.assetNames.map((a) => `* ${basename(a)}\t${a}`).join('\n')}\n\n`
      );
      return input;
    },
  },
  ['glob-assets']: {
    description: 'replaces input with list of globbed assets',
    run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const pattern = await commandArgument(runtime, args.shift(), 'usage: glob-assets "<glob>"');
      return `${JSON.stringify(assetGlob(runtime, pattern))}\n`;
    },
  },
  cat: {
    description: 'replaces input with file or asset',
    run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const uri = await commandArgument(runtime, args.shift(), 'usage: cat "<file>"');

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
  },
  ['resolve-asset']: {
    description: 'replaces input with file or asset resolved from it',
    run: async (input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      // Lazy. DRI with cat
      const uri = await readableToString(input);
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
  },
};

export default commands;
