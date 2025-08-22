import type {
  Arguments,
  Assets,
  Command,
  IPluginRuntimeEvent,
  LoggingEvent,
  RuntimeCloneChildEvent,
  RuntimeCloneParentEvent,
} from '@or-q/lib';
import {
  commandArgument,
  type Commands,
  fail,
  type IPluginRuntime,
  loggingEventName,
  logLevels,
  type Plugin,
  type PluginRecord,
  PluginRuntimeFailure,
  runtimeCloneChildEventName,
  runtimeCloneParentEventName,
  runtimeNewCommandAddedEventName,
} from '@or-q/lib';
import installedNodeModules from 'installed-node-modules';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
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

type Contexts = Record<string, unknown[]>;

// Lazy. This should use EventMap<T>
export class PluginRuntime implements IPluginRuntime {
  plugins: PluginRecord;
  pluginNames: string[];
  commandNames: string[];
  commandNameSet: Set<string>;
  assetNames: string[];
  assets: Assets;
  commands: Commands;

  private emitter: EventEmitter = new EventEmitter();
  private pluginsArray: Plugin[];
  private context: Contexts = {};

  constructor(pluginsArray: Plugin[], context: Contexts = {}) {
    this.pluginsArray = pluginsArray;
    this.context = context;
    this.plugins = Object.fromEntries(pluginsArray.map((p) => [p.name, p]));
    this.pluginNames = pluginsArray.map((p) => p.name);
    this.assets = resolveRecord(pluginsArray, 'assets', true);
    this.assetNames = Object.keys(this.assets);
    this.commands = resolveRecord(pluginsArray, 'commands');
    this.commandNames = Object.keys(this.commands);
    this.commandNameSet = new Set(this.commandNames);

    for (const plugin of pluginsArray) {
      if (plugin.eventListeners) {
        for (const [eventName, listener] of Object.entries(plugin.eventListeners)) {
          this.emitter.on(eventName, listener);
        }
      }
    }
  }

  clone(): IPluginRuntime {
    const child = new PluginRuntime(
      this.pluginsArray,
      JSON.parse(JSON.stringify(this.context)) // Lazy. Do a proper deep copy
    );
    this.emit<RuntimeCloneParentEvent>(runtimeCloneParentEventName, { source: pkg.name, parent: this, child });
    child.emit<RuntimeCloneChildEvent>(runtimeCloneChildEventName, { source: pkg.name, parent: this, child });
    return child;
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

  // Lazy. This should be in a IPluginRuntime sub-interface or mixin, as not all plugin systems need that
  // Lazy. Tighten up generic so event and eventName are closely related.
  emit<E extends IPluginRuntimeEvent>(eventName: string, event: E): boolean {
    return this.emitter.emit(eventName, event);
  }

  // Lazy. This should be in a IPluginRuntime sub-interface or mixin, as not all plugin systems need that
  pushContext<T>(id: string, data: T): T {
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
    return data;
  }

  // Lazy. This should be in a IPluginRuntime sub-interface or mixin, as not all plugin systems need that
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

  // Lazy. This should be in a IPluginRuntime sub-interface or mixin, as not all plugin systems need that
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

  // Lazy. This should be in IORQPluginRuntime, as it is OR-Q specific
  async addCommand(pluginName: string, commandName: string, command: Command) {
    const plugin = this.plugins[pluginName];
    if (!plugin) {
      return fail(`addCommand: unknown plugin ${pluginName}`);
    }

    if (this.commandNameSet.has(commandName)) {
      return fail(`addCommand: command ${commandName} is already registered`);
    }

    this.emit(loggingEventName, {
      source: pkg.name,
      level: logLevels.debug,
      value: ['addCommand', pluginName, commandName],
    } as LoggingEvent);

    plugin.commands ??= {};
    plugin.commands[commandName] = command;

    this.commandNames.push(commandName);
    this.commandNameSet.add(commandName);
    this.commands[commandName] = command;

    this.emit(runtimeNewCommandAddedEventName, {
      source: pkg.name,
      plugin: pluginName,
      command: commandName,
    });
  }

  // Lazy. This should be in IORQPluginRuntime, as it is OR-Q specific
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

    const error = (...args: unknown[]) => {
      this.emit(loggingEventName, {
        source: pkg.name,
        level: logLevels.error,
        value: args,
      } as LoggingEvent);
    };

    dbg('runCommands: executing', program);

    // Lazy. Reuse something?
    function truncate(str: string, maxlen: number, suffix: string = '...') {
      if (str.length <= maxlen) {
        return str;
      }
      return `${str.substring(0, maxlen)}${suffix}`;
    }

    const args = program.slice();
    while (args.length > 0) {
      const command = await commandArgument(this, args.shift(), 'Internal error: unreachable');
      if (!(command in this.commands)) {
        // Lazy. DRY with below
        const failedAt = program.length - args.length - 1;
        for (let i = 0; i < program.length; ++i) {
          const open = i === failedAt ? '> ' : '  ';
          const close = i === failedAt ? ' <' : '';
          // Lazy, compute maximum padding.
          error(`${i.toString().padStart(3)}: ${open}${truncate(String(program[i]).trim(), 60)}${close}`);
        }
        return fail(`Unknown command "${command}"`);
      }
      dbg('runCommands: running', command);
      try {
        input = await this.commands[command].run(input, args, this);
        if (!(input instanceof Readable || typeof input === 'string')) {
          error('input is', input);
          // Lazy. DRY with below
          const failedAt = program.length - args.length - 1;
          for (let i = 0; i < program.length; ++i) {
            const open = i === failedAt ? '> ' : '  ';
            const close = i === failedAt ? ' <' : '';
            // Lazy, compute maximum padding.
            error(`${i.toString().padStart(3)}: ${open}${truncate(String(program[i]).trim(), 60)}${close}`);
          }
          return fail(`runCommands: internal error, invalid resulting input type; ${typeof input}`);
        }
      } catch (e: unknown) {
        if (e instanceof PluginRuntimeFailure) {
          dbg(`command ${command} failed`, e.message);
          throw e;
        }
        // Lazy. Improve diagnostics.
        const failedAt = program.length - args.length - 1;
        for (let i = 0; i < program.length; ++i) {
          const open = i === failedAt ? '> ' : '  ';
          const close = i === failedAt ? ' <' : '';
          // Lazy, compute maximum padding.
          error(`${i.toString().padStart(3)}: ${open}${truncate(String(program[i]).trim(), 60)}${close}`);
        }
        error(`command ${command} failed`, e);
        throw e;
      }
      spam('runCommands: done running', command);
    }

    spam('runCommands: done executing', program);

    if (!(input instanceof Readable || typeof input === 'string')) {
      error('input is', input);
      error('after execution of\n', program.join('\n'));
      return fail(`runCommands: internal error, invalid resulting input type; ${typeof input}`);
    }

    return input;
  }
}
