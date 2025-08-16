import { type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import yaml from 'yaml';
import type { Script } from '../utils.ts';

const command: Command = {
  description: 'Returns JSON array of all YAML scripts with their metadata, requirements, and command structures',
  usage: 'usage: discover-scripts',
  tags: ['discovery-command'],
  run: async (_input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string> => {
    const scripts: Array<{
      name: string;
      plugin: string;
      description: string | null;
      path: string;
      requires: string[];
      hasOnEmptyStdin: boolean;
    }> = [];

    // Collect all YAML script assets
    for (const assetName of runtime.assetNames) {
      if (assetName.endsWith('.yaml') && assetName.includes('script')) {
        let pluginName = 'unknown';
        let scriptName = assetName;

        if (assetName.startsWith('plugin:')) {
          const parts = assetName.split('/');
          pluginName = parts[0].substring(7); // Remove 'plugin:' prefix
          scriptName = parts.slice(1).join('/');
        }

        let description: string | null = null;
        let requires: string[] = [];
        let hasOnEmptyStdin = false;

        try {
          const content = runtime.assets[assetName];
          if (content) {
            const data = yaml.parse(content) as Script;
            description = data.description || null;
            requires = data.requires || [];
            hasOnEmptyStdin = !!data['on-empty-stdin'];
          }
        } catch {
          // Ignore parsing errors, use defaults
        }

        scripts.push({
          name: scriptName,
          plugin: pluginName,
          description,
          path: assetName,
          requires,
          hasOnEmptyStdin,
        });
      }
    }

    // Sort by script name
    scripts.sort((a, b) => a.name.localeCompare(b.name));

    return JSON.stringify(scripts) + '\n';
  },
};

export default command;
