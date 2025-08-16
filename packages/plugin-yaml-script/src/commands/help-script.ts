import { type Arguments, commandArgument, type Command, fail, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import yaml from 'yaml';
import type { Script } from '../utils.ts';

const usage = 'help-script "<script>"';

const command: Command = {
  description: 'Shows detailed help for a specific script including description, required plugins, and parameters',
  usage,
  tags: ['help-command'],
  run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string> => {
    const scriptName = await commandArgument(runtime, args.shift(), usage);

    // Find the script asset
    let foundAsset: string | null = null;
    let pluginName = 'unknown';

    for (const assetName of runtime.assetNames) {
      if (assetName.endsWith('.yaml') && assetName.includes(scriptName)) {
        foundAsset = assetName;

        if (assetName.startsWith('plugin:')) {
          const parts = assetName.split('/');
          pluginName = parts[0].substring(7); // Remove 'plugin:' prefix
        }
        break;
      }
    }

    if (!foundAsset) {
      return fail(`Script "${scriptName}" not found`);
    }

    let scriptData: Script;
    try {
      const content = runtime.assets[foundAsset];
      scriptData = yaml.parse(content) as Script;
    } catch (error) {
      return fail(`Failed to parse script "${scriptName}": ${error}`);
    }

    let output = `Script: ${scriptName}\n`;
    output += `Plugin: ${pluginName}\n`;
    output += `Description: ${scriptData.description || 'No description available'}\n\n`;

    output += `Usage: pnpm or-q run ${scriptName}\n\n`;

    if (scriptData.requires && scriptData.requires.length > 0) {
      output += 'Required Plugins:\n';
      for (const req of scriptData.requires) {
        const installed = runtime.plugins[req] ? '✓' : '✗';
        output += `  ${installed} ${req}\n`;
      }
      output += '\n';
    }

    if (scriptData['on-empty-stdin']) {
      output += 'Handles empty stdin: Yes\n';
    }

    return output.trimEnd();
  },
};

export default command;
