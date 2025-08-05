import { type Plugin, type Commands, fail } from '@or-q/lib';
import installedNodeModules from 'installed-node-modules';
import { Readable } from 'node:stream';

export function listAllPluginModules(
  re: RegExp = /((^@or-q\/plugin-)|(or-q-plugin))/
) {
  const allPackages = installedNodeModules();
  const result = [...allPackages].filter((id) => !!re.test(id));
  return result;
}

export interface Plugins {
  pluginNames: string[];
  commandNames: string[];
  commands: Commands;
  usage: () => string;
  runCommands: (
    input: string | Readable,
    args: string[]
  ) => Promise<string | Readable>;
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

export async function loadAllPlugins(): Promise<Plugins> {
  const pluginNames = listAllPluginModules();
  const plugins = (
    await Promise.all(pluginNames.map((name) => import(name)))
  ).map((module) => module.default as Plugin);

  // Lazy. Optimizable, do not walk over the same array multiple times.

  const commands: Commands = resolveRecord(plugins, 'commands');
  const commandNames = Object.keys(commands);

  // Lazy. This should be a class.
  return {
    pluginNames,
    commandNames,
    commands,

    usage: (): string => {
      return `Available commands: ${Object.keys(commands).join(', ')}`;
    },

    runCommands: async (
      input: string | Readable,
      args: string[]
    ): Promise<string | Readable> => {
      while (args.length > 0) {
        const command = args.shift()!;
        if (!(command in commands)) {
          fail(`Unknown command ${command}`);
        }
        // Lazy, implicit arg eating sucks.
        input = await commands[command].run(input, args); // This will eat more args
      }

      return input;
    },
  };
}
