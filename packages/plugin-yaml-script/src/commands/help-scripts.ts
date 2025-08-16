import { type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import yaml from 'yaml';
import type { Script } from '../utils.ts';

const command: Command = {
  description: 'Lists all available YAML scripts with their descriptions and usage information',
  tags: ['help-command'],
  run: async (_input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string> => {
    const scriptEntries: Array<{ name: string; plugin: string; description: string | null }> = [];

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
        try {
          const content = runtime.assets[assetName];
          if (content) {
            const data = yaml.parse(content) as Script;
            description = data.description || null;
          }
        } catch {
          // Ignore parsing errors for description extraction
        }

        scriptEntries.push({
          name: scriptName,
          plugin: pluginName,
          description,
        });
      }
    }

    // Sort by script name
    scriptEntries.sort((a, b) => a.name.localeCompare(b.name));

    if (scriptEntries.length === 0) {
      return 'No YAML scripts found.';
    }

    let output = 'Available Scripts:\n\n';

    // Group by plugin
    const byPlugin = new Map<string, typeof scriptEntries>();
    for (const entry of scriptEntries) {
      if (!byPlugin.has(entry.plugin)) {
        byPlugin.set(entry.plugin, []);
      }
      byPlugin.get(entry.plugin)!.push(entry);
    }

    // Sort plugins alphabetically
    const sortedPlugins = Array.from(byPlugin.keys()).sort();

    for (const pluginName of sortedPlugins) {
      const scripts = byPlugin.get(pluginName)!;
      output += `${pluginName}:\n`;

      for (const script of scripts) {
        const desc = script.description || 'No description available';
        output += `  ${script.name.padEnd(30)} ${desc}\n`;
      }
      output += '\n';
    }

    return output.trimEnd();
  },
};

export default command;
