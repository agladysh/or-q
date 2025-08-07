import type { Arguments, Assets } from '@or-q/lib';
import {
  commandArgument,
  type Commands,
  fail,
  type IPluginRuntime,
  type Plugin,
} from '@or-q/lib';
import installedNodeModules from 'installed-node-modules';
import type { Readable } from 'node:stream';

export function listAllPluginModules(
  re: RegExp = /((^@or-q\/plugin-)|(or-q-plugin))/
) {
  const allPackages = installedNodeModules();
  const result = [...allPackages].filter((id) => !!re.test(id));
  return result;
}

type UnknownRecord = Record<PropertyKey, unknown>;

function resolveRecord<
  Field extends keyof Plugin,
  Result extends Extract<Plugin, UnknownRecord>[Field],
>(plugins: Plugin[], field: Field, prefix: boolean = false): Result {
  const result: UnknownRecord = {};
  for (const plugin of plugins) {
    if (plugin[field] !== undefined) {
      for (const [k, v] of Object.entries(plugin[field])) {
        const key = `${prefix ? `plugin:${plugin.name}/` : ''}${k}`;
        if (v === undefined) {
          continue;
        }
        if (result[key] !== undefined) {
          // Lazy. We should capture original setter for more user-friendly error messages.
          process.emitWarning(
            `plugin ${plugin.name} overrode previously set ${field} value ${key}`
          );
        }
        result[key] = v;
      }
    }
  }
  return result as Result;
}

export class PluginRuntime implements IPluginRuntime {
  plugins: Record<string, Plugin>;
  pluginNames: string[];
  commandNames: string[];
  assetNames: string[];
  assets: Assets;
  commands: Commands;

  constructor(plugins: Plugin[]) {
    this.plugins = Object.fromEntries(plugins.map((p) => [p.name, p]));
    this.pluginNames = plugins.map((p) => p.name);
    this.assets = resolveRecord(plugins, 'assets', true);
    this.assetNames = Object.keys(this.assets);
    this.commands = resolveRecord(plugins, 'commands');
    this.commandNames = Object.keys(this.commands);
  }

  static async fromNodeModules(): Promise<PluginRuntime> {
    const pluginNames = listAllPluginModules();
    const plugins = (
      await Promise.all(pluginNames.map((name) => import(name)))
    ).map((module) => module.default as Plugin);
    return new PluginRuntime(plugins);
  }

  // Lazy. This does not belong here.
  usage(): string {
    return `Available commands: ${this.commandNames.join(', ')}`;
  }

  async runCommands(
    input: string | Readable,
    args: Arguments
  ): Promise<string | Readable> {
    args = args.slice();
    while (args.length > 0) {
      const command = await commandArgument(
        this,
        args.shift(),
        'Internal error: unreachable'
      );
      if (!(command in this.commands)) {
        fail(`Unknown command ${command}`);
      }
      input = await this.commands[command].run(input, args, this);
    }

    return input;
  }
}
