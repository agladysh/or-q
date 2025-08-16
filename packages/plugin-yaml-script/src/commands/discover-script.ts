import { type Arguments, commandArgument, type Command, fail, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const usage = 'discover-script "<script>"';

const command: Command = {
  description: 'displays full script YAML',
  usage,
  tags: ['discovery-command'],
  run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string> => {
    const scriptName = await commandArgument(runtime, args.shift(), usage);

    // Find the script asset
    let foundAsset: string | null = null;

    for (const assetName of runtime.assetNames) {
      if (assetName.endsWith('.yaml') && assetName.includes(scriptName)) {
        foundAsset = assetName;
        break;
      }
    }

    if (!foundAsset) {
      return fail(`Script "${scriptName}" not found`);
    }

    const content = runtime.assets[foundAsset];
    if (!content) {
      return fail(`Script "${scriptName}" content is empty`);
    }

    return content + '\n';
  },
};

export default command;
