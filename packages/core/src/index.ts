import type { Arguments, Assets, IPluginRuntimeEvent, IPluginRuntimeEventListener, LoggingEvent } from '@or-q/lib';
import {
  commandArgument,
  type Commands,
  fail,
  type IPluginRuntime,
  loggingEventName,
  logLevels,
  type Plugin,
} from '@or-q/lib';
import installedNodeModules from 'installed-node-modules';
import { type Readable } from 'node:stream';
import { EventEmitter } from 'node:events';
import pkg from '../package.json' with { type: 'json' };

export function listAllPluginModules(re: RegExp = /((^@or-q\/plugin-)|(or-q-plugin))/) {
  const allPackages = installedNodeModules();
  const result = [...allPackages].filter((id) => !!re.test(id));
  return result;
}

type UnknownRecord = Record<PropertyKey, unknown>;

function resolveRecord<Field extends keyof Plugin, Result extends Extract<Plugin, UnknownRecord>[Field]>(
  plugins: Plugin[],
  field: Field,
  prefix: boolean = false
): Result {
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
          process.emitWarning(`plugin ${plugin.name} overrode previously set ${field} value ${key}`);
        }
        result[key] = v;
      }
    }
  }
  return result as Result;
}

// Lazy. This should use EventMap<T>
export class PluginRuntime extends EventEmitter implements IPluginRuntime {
  plugins: Record<string, Plugin>;
  pluginNames: string[];
  commandNames: string[];
  assetNames: string[];
  assets: Assets;
  commands: Commands;
  private context: Record<string, unknown[]> = {};

  constructor(plugins: Plugin[]) {
    super();
    this.plugins = Object.fromEntries(plugins.map((p) => [p.name, p]));
    this.pluginNames = plugins.map((p) => p.name);
    this.assets = resolveRecord(plugins, 'assets', true);
    this.assetNames = Object.keys(this.assets);
    this.commands = resolveRecord(plugins, 'commands');
    this.commandNames = Object.keys(this.commands);

    for (const plugin of plugins) {
      if (plugin.eventListeners) {
        for (const [eventName, listener] of Object.entries(plugin.eventListeners)) {
          this.on(eventName, listener);
        }
      }
    }
  }

  static async fromNodeModules(): Promise<PluginRuntime> {
    const pluginNames = listAllPluginModules();
    const plugins = (await Promise.all(pluginNames.map((name) => import(name)))).map(
      (module) => module.default as Plugin
    );
    return new PluginRuntime(plugins);
  }

  // Lazy. This does not belong here.
  usage(): string {
    return `Available commands: ${this.commandNames.join(', ')}`;
  }

  on<T extends IPluginRuntimeEventListener>(eventName: string, listener: T) {
    super.on(eventName, listener);
    return this;
  }

  emit<E extends IPluginRuntimeEvent>(eventName: string, event: E): boolean {
    return super.emit(eventName, event);
  }

  pushContext<T>(id: string, data: T): void {
    this.emit(loggingEventName, {
      source: pkg.name,
      level: logLevels.spam,
      value: ['pushContext', id, data],
    } as LoggingEvent);

    let ctx = this.context[id];
    if (ctx === undefined) {
      ctx = [];
      this.context[id] = ctx;
    }
    ctx.push(data);
  }

  popContext<T>(id: string): T | undefined {
    const ctx = this.context[id];
    if (ctx === undefined) {
      this.emit(loggingEventName, {
        source: pkg.name,
        level: logLevels.debug,
        value: ['popContext', id, 'not found'],
      } as LoggingEvent);

      return undefined;
    }

    this.emit(loggingEventName, {
      source: pkg.name,
      level: logLevels.spam,
      value: ['popContext', id, ctx[ctx.length - 1]],
    } as LoggingEvent);

    return ctx.pop() as T;
  }

  getContext<T>(id: string): T | undefined {
    const ctx = this.context[id];
    if (ctx === undefined) {
      this.emit(loggingEventName, {
        source: pkg.name,
        level: logLevels.debug,
        value: ['getContext', id, 'not found'],
      } as LoggingEvent);
      return undefined;
    }

    this.emit(loggingEventName, {
      source: pkg.name,
      level: logLevels.spam,
      value: ['getContext', id, ctx[ctx.length - 1]],
    } as LoggingEvent);

    return ctx[ctx.length - 1] as T;
  }

  // Lazy. This should be in IORQPluginRuntime
  async runCommands(input: string | Readable, program: Arguments): Promise<string | Readable> {
    // Lazy. Generalize so it is reusable.
    const spam = (...args: unknown[]) => {
      this.emit(loggingEventName, {
        source: pkg.name,
        level: logLevels.spam,
        value: args,
      } as LoggingEvent);
    };

    const dbg = (...args: unknown[]) => {
      this.emit(loggingEventName, {
        source: pkg.name,
        level: logLevels.debug,
        value: args,
      } as LoggingEvent);
    };

    dbg('runCommands: executing', program);

    const args = program.slice();
    while (args.length > 0) {
      const command = await commandArgument(this, args.shift(), 'Internal error: unreachable');
      if (!(command in this.commands)) {
        dbg('failed while executing', program);
        dbg('remaining program', args);
        fail(`Unknown command "${command}"`);
      }
      dbg('runCommands: running', command);
      try {
        input = await this.commands[command].run(input, args, this);
      } catch (e: unknown) {
        // Lazy. Improve diagnostics.
        console.error(`command ${command} failed`);
        throw e;
      }
      spam('runCommands: done running', command);
    }

    spam('runCommands: done executing', program);

    return input;
  }
}
