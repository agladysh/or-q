import type { Plugin, Commands } from '@or-q/lib';
import installedNodeModules from 'installed-node-modules';

export function listAllPlugins(
  re: RegExp = /((^@or-q\/plugin-)|(or-q-plugin))/
) {
  const allPackages = installedNodeModules();
  const result = [...allPackages].filter((id) => !!re.test(id));
  return result;
}

export interface Plugins {
  names: string[];
  commands: Commands;
}

export async function loadAllPlugins(): Promise<Plugins> {
  const pluginNames = listAllPlugins();
  const plugins = (
    await Promise.all(pluginNames.map((name) => import(name)))
  ).map((module) => module.default as Plugin);

  // Lazy. Optimizable, do not walk over the same array multiple times.

  function resolveRecord<
    F extends keyof Plugin,
    K extends keyof Plugin[F],
    V extends Plugin[F][K],
    R extends Record<K, V>,
  >(field: F): R {
    const result: R = {} as R;
    for (const plugin of plugins) {
      if (plugin[field] !== undefined) {
        for (const [k, v] of Object.entries(plugin[field])) {
          if (v === undefined) {
            continue;
          }
          if (k in result) {
            // Lazy. We should capture original setter for more user-friendly error messages.
            process.emitWarning(
              `plugin ${plugin.name} overrode previously set ${field} value ${k}`
            );
          }
          result[k as K] = v;
        }
      }
    }
    return result;
  }

  // Lazy. This should be typed.
  return {
    names: pluginNames,
    commands: resolveRecord('commands'),
  };
}
