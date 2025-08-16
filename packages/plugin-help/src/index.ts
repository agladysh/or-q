import {
  type Commands,
  type Plugin,
  type IPluginRuntime,
  type Arguments,
  type Command,
  commandArgument,
} from '@or-q/lib';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Readable } from 'node:stream';

const pkg = JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf-8')) as {
  name: string;
  description: string;
};

export const tagHelpCommand = 'help-command';

const commands: Commands = {
  help: {
    description: 'Lists all commands with the help-command tag in alphabetic order',
    tags: [tagHelpCommand],
    run: async (_input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string> => {
      // Get all commands with help-command tag
      const helpCommands = Object.entries(runtime.commands)
        .filter(([_, command]) => command.tags?.includes(tagHelpCommand))
        .sort(([a], [b]) => a.localeCompare(b));

      let output = 'Available Commands:\\n\\n';

      if (helpCommands.length > 0) {
        output += 'Help Commands:\\n';
        for (const [name, command] of helpCommands) {
          output += `  ${name.padEnd(20)} ${command.description}\\n`;
        }
        output += '\\n';
      }

      // Also show other commonly used commands (without help-command tag)
      const otherCommands = Object.entries(runtime.commands)
        .filter(([_, command]) => !command.tags?.includes(tagHelpCommand))
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(0, 10); // Show first 10

      if (otherCommands.length > 0) {
        output += 'Core Commands:\\n';
        for (const [name, command] of otherCommands) {
          output += `  ${name.padEnd(20)} ${command.description}\\n`;
        }
      }

      return output;
    },
  },

  'help-commands': {
    description: 'List all commands with their descriptions, grouped by plugin',
    tags: [tagHelpCommand],
    run: async (_input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string> => {
      let output = 'Commands by Plugin:\\n\\n';

      // Group commands by plugin
      const commandsByPlugin: Record<string, Array<[string, Command]>> = {};

      // Build reverse mapping from command to plugin
      for (const [pluginName, plugin] of Object.entries(runtime.plugins)) {
        if (plugin.commands) {
          for (const commandName of Object.keys(plugin.commands)) {
            if (!commandsByPlugin[pluginName]) {
              commandsByPlugin[pluginName] = [];
            }
            commandsByPlugin[pluginName].push([commandName, runtime.commands[commandName]]);
          }
        }
      }

      // Sort plugins and commands
      const sortedPlugins = Object.keys(commandsByPlugin).sort();

      for (const pluginName of sortedPlugins) {
        output += `${pluginName}:\\n`;
        const commands = commandsByPlugin[pluginName].sort(([a], [b]) => a.localeCompare(b));

        for (const [name, command] of commands) {
          output += `  ${name.padEnd(20)} ${command.description}\\n`;
        }
        output += '\\n';
      }

      return output;
    },
  },

  'help-commands-by-tag': {
    description: 'List all commands with a specific tag',
    usage: 'help-commands-by-tag "<tag>"',
    tags: [tagHelpCommand],
    run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string> => {
      const tag = await commandArgument(runtime, args.shift(), 'usage: help-commands-by-tag "<tag>"');

      const taggedCommands = Object.entries(runtime.commands)
        .filter(([_, command]) => command.tags?.includes(tag))
        .sort(([a], [b]) => a.localeCompare(b));

      if (taggedCommands.length === 0) {
        return `No commands found with tag "${tag}"`;
      }

      let output = `Commands with tag "${tag}":\\n\\n`;
      for (const [name, command] of taggedCommands) {
        output += `  ${name.padEnd(20)} ${command.description}\\n`;
      }

      return output;
    },
  },

  'help-command': {
    description: 'Prints command description and usage string',
    usage: 'help-command "<command>"',
    tags: [tagHelpCommand],
    run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string> => {
      const commandName = await commandArgument(runtime, args.shift(), 'usage: help-command "<command>"');

      const command = runtime.commands[commandName];
      if (!command) {
        return `Command "${commandName}" not found`;
      }

      let output = `Command: ${commandName}\\n`;
      output += `Description: ${command.description}\\n`;

      if (command.usage) {
        output += `Usage: ${command.usage}\\n`;
      }

      if (command.tags && command.tags.length > 0) {
        output += `Tags: ${command.tags.join(', ')}\\n`;
      }

      return output;
    },
  },

  'help-plugins': {
    description: 'Lists all available plugins with their descriptions, sorted alphabetically',
    tags: [tagHelpCommand],
    run: async (_input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string> => {
      let output = 'Available Plugins:\\n\\n';

      const sortedPlugins = Object.entries(runtime.plugins).sort(([a], [b]) => a.localeCompare(b));

      for (const [name, plugin] of sortedPlugins) {
        const description = plugin.description || 'No description available';
        output += `${name.padEnd(30)} ${description}\\n`;
      }

      return output;
    },
  },

  'help-plugin': {
    description: 'Shows detailed information about a specific plugin including its commands and assets',
    usage: 'help-plugin "<plugin.name>"',
    tags: [tagHelpCommand],
    run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string> => {
      const pluginName = await commandArgument(runtime, args.shift(), 'usage: help-plugin "<plugin.name>"');

      const plugin = runtime.plugins[pluginName];
      if (!plugin) {
        return `Plugin "${pluginName}" not found`;
      }

      let output = `Plugin: ${pluginName}\\n`;
      output += `Description: ${plugin.description || 'No description available'}\\n\\n`;

      if (plugin.commands && Object.keys(plugin.commands).length > 0) {
        output += 'Commands:\\n';
        const sortedCommands = Object.entries(plugin.commands).sort(([a], [b]) => a.localeCompare(b));

        for (const [name, command] of sortedCommands) {
          output += `  ${name.padEnd(20)} ${command.description}\\n`;
        }
        output += '\\n';
      }

      if (plugin.assets && Object.keys(plugin.assets).length > 0) {
        output += 'Assets:\\n';
        const sortedAssets = Object.keys(plugin.assets).sort();

        for (const assetName of sortedAssets) {
          output += `  ${assetName}\\n`;
        }
      }

      return output;
    },
  },

  'help-assets': {
    description: 'Lists all available assets with their descriptions and plugin sources',
    tags: [tagHelpCommand],
    run: async (_input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string> => {
      let output = 'Available Assets:\\n\\n';

      // Group assets by plugin
      const assetsByPlugin: Record<string, string[]> = {};

      for (const assetName of runtime.assetNames) {
        if (assetName.startsWith('plugin:')) {
          const parts = assetName.split('/');
          const pluginName = parts[0].substring(7); // Remove 'plugin:' prefix

          if (!assetsByPlugin[pluginName]) {
            assetsByPlugin[pluginName] = [];
          }
          assetsByPlugin[pluginName].push(parts.slice(1).join('/'));
        }
      }

      const sortedPlugins = Object.keys(assetsByPlugin).sort();

      for (const pluginName of sortedPlugins) {
        output += `${pluginName}:\\n`;
        const assets = assetsByPlugin[pluginName].sort();

        for (const assetPath of assets) {
          // Try to get description from YAML assets
          let description = '';
          try {
            const fullAssetName = `plugin:${pluginName}/${assetPath}`;
            const content = runtime.assets[fullAssetName];
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

          if (description) {
            output += `  ${assetPath.padEnd(35)} ${description}\\n`;
          } else {
            output += `  ${assetPath}\\n`;
          }
        }
        output += '\\n';
      }

      return output;
    },
  },
};

const plugin: Plugin = {
  name: pkg.name,
  description: pkg.description,
  commands,
};

export default plugin;
