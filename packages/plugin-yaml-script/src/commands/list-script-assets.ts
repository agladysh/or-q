import { assetGlob, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import { parse } from 'node:path';
import type { Readable } from 'node:stream';

const usage = 'usage: list-script-assets';

const command: Command = {
  description: 'prints the list of available builtin scripts to stdout, passes input along',
  usage,
  tags: [],
  run: async (input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    // Lazy. Sort by name, so duplicates are clearly visible.
    const assetNames = assetGlob(runtime, `**/scripts/**/*.yaml`).sort();
    process.stdout.write(
      `Available script assets:\n\n${assetNames.map((a) => `* ${parse(a).name}\t${a}`).join('\n')}\n\n`
    );
    return input;
  },
};

export default command;
