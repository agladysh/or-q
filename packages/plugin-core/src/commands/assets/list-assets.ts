import { type IPluginRuntime, type Command, type Arguments } from '@or-q/lib';
import { basename } from 'node:path';
import type { Readable } from 'node:stream';

const command: Command = {
  description: 'prints the list of available assets to stdout, passes input along',
  run: async (input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    process.stdout.write(
      `Available assets:\n\n${runtime.assetNames.map((a) => `* ${basename(a)}\t${a}`).join('\n')}\n\n`
    );
    return input;
  },
};

export default command;
