import {
  type Plugin,
  type Commands,
  fail,
  type IPluginRuntime,
} from '@or-q/lib';
import installedNodeModules from 'installed-node-modules';
import { Readable } from 'node:stream';

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
  Result extends Extract<Plugin[Field], UnknownRecord>,
>(plugins: Plugin[], field: Field): Result {
  const result: UnknownRecord = {};
  for (const plugin of plugins) {
    if (plugin[field] !== undefined) {
      for (const [k, v] of Object.entries(plugin[field])) {
        if (v === undefined) {
          continue;
        }
        if (result[k] !== undefined) {
          // Lazy. We should capture original setter for more user-friendly error messages.
          process.emitWarning(
            `plugin ${plugin.name} overrode previously set ${field} value ${k}`
          );
        }
        result[k] = v;
      }
    }
  }
  return result as Result;
}

export class PluginRuntime implements IPluginRuntime {
  pluginNames: string[];
  commandNames: string[];
  commands: Commands;

  constructor(plugins: Plugin[]) {
    this.pluginNames = plugins.map((p) => p.name);
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

  usage(): string {
    return `Available commands: ${this.commandNames.join(', ')}`;
  }

  async runCommands(
    input: string | Readable,
    args: string[]
  ): Promise<string | Readable> {
    args = args.slice();
    while (args.length > 0) {
      const command = args.shift()!;
      if (!(command in this.commands)) {
        fail(`Unknown command ${command}`);
      }
      input = await this.commands[command].run(input, args, this);
    }

    return input;
  }
}
