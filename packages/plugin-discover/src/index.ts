import { type Commands, type Plugin, type IPluginRuntime, type Arguments } from '@or-q/lib';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Readable } from 'node:stream';

const pkg = JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf-8')) as {
  name: string;
  description: string;
};

export const tagDiscoverCommand = 'discovery-command';

const commands: Commands = {
  discover: {
    description: 'List discovery commands as JSON',
    tags: [tagDiscoverCommand],
    run: async (_input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string> => {
      const discoveryCommands = Object.entries(runtime.commands)
        .filter(([_, command]) => command.tags?.includes(tagDiscoverCommand))
        .map(([name, command]) => ({
          name,
          description: command.description,
          tags: command.tags || [],
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return JSON.stringify(discoveryCommands) + '\\n';
    },
  },

  'discover-commands': {
    description: 'List all commands with full metadata as JSON',
    tags: [tagDiscoverCommand],
    run: async (_input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string> => {
      const commandsData = Object.entries(runtime.commands)
        .map(([name, command]) => {
          // Find which plugin this command belongs to
          let pluginSource = 'unknown';
          for (const [pluginName, plugin] of Object.entries(runtime.plugins)) {
            if (plugin.commands && name in plugin.commands) {
              pluginSource = pluginName;
              break;
            }
          }

          return {
            name,
            description: command.description,
            usage: command.usage || null,
            tags: command.tags || [],
            plugin: pluginSource,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      return JSON.stringify(commandsData) + '\\n';
    },
  },

  'discover-plugins': {
    description: 'List all plugins with metadata as JSON',
    tags: [tagDiscoverCommand],
    run: async (_input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string> => {
      const pluginsData = Object.entries(runtime.plugins)
        .map(([name, plugin]) => ({
          name,
          description: plugin.description || null,
          commands: plugin.commands ? Object.keys(plugin.commands).sort() : [],
          assets: plugin.assets ? Object.keys(plugin.assets).sort() : [],
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return JSON.stringify(pluginsData) + '\\n';
    },
  },

  'discover-assets': {
    description: 'List all assets with metadata as JSON',
    tags: [tagDiscoverCommand],
    run: async (_input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string> => {
      const assetsData = runtime.assetNames
        .map((assetName) => {
          let pluginName = 'unknown';
          let assetPath = assetName;

          if (assetName.startsWith('plugin:')) {
            const parts = assetName.split('/');
            pluginName = parts[0].substring(7); // Remove 'plugin:' prefix
            assetPath = parts.slice(1).join('/');
          }

          // Try to get description from YAML assets
          let description: string | null = null;
          try {
            const content = runtime.assets[assetName];
            if (content && assetPath.endsWith('.yaml')) {
              // Simple regex to extract description from YAML
              const match = content.match(/^description:\\s*(.+)$/m);
              if (match) {
                description = match[1].trim();
              }
            }
          } catch {
            // Ignore errors
          }

          return {
            name: assetPath,
            plugin: pluginName,
            description,
            path: assetName,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      return JSON.stringify(assetsData) + '\\n';
    },
  },
};

const plugin: Plugin = {
  name: pkg.name,
  description: pkg.description,
  commands,
};

export default plugin;
