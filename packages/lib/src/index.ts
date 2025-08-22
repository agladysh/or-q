import { globSync, type GlobOptions } from 'glob';
import { minimatch, type MinimatchOptions } from 'minimatch';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

export function mergeCommands(pluginName: string, commands: Commands[]): Commands {
  const merged: Commands = {};
  for (const cmd of commands) {
    for (const [name, command] of Object.entries(cmd)) {
      if (merged[name]) {
        process.emitWarning(`Command "${name}" from plugin "${pluginName}" overrides a previously registered command.`);
      }
      merged[name] = command;
    }
  }
  return merged;
}

export type CommandExport = (Command & { command: string }) | { default: Commands[] };
export function commandsFromImports(pluginName: string, ...imports: CommandExport[]): Commands {
  const normalize = (c: CommandExport): Commands[] => {
    if ('default' in c) {
      return c.default;
    }
    const { command, ...rest } = c;
    return [{ [command]: rest }];
  };

  return mergeCommands(pluginName, imports.flatMap(normalize));
}

export type Arguments = (string | Arguments)[];

export interface Command {
  description: string;
  run: (input: string | Readable, args: Arguments, runtime: IPluginRuntime) => Promise<string | Readable>;
}

export type Commands = Record<string, Command>;
export type Asset = string;
export type AssetURI = string;
export type Assets = Record<AssetURI, Asset>;

export const logLevelNames = ['spam', 'debug', 'info', 'log', 'warn', 'error', 'none'] as const;

export type LogLevel = (typeof logLevelNames)[number];
export type LogLevelOrd = number;
export type LogLevels = Record<LogLevel, LogLevel>;

export const logLevels: LogLevels = Object.fromEntries(logLevelNames.map((name) => [name, name])) as LogLevels;

type LogLevelOrds = Record<string, LogLevelOrd>;
export const logLevelOrds: LogLevelOrds = Object.fromEntries(
  logLevelNames.map((name, index) => [name, index])
) as LogLevelOrds;

export interface IPluginRuntimeEvent {
  source: string;
}

export type IPluginRuntimeEventListener<E extends IPluginRuntimeEvent = IPluginRuntimeEvent> = (event: E) => void;

export type IPluginRuntimeEventListeners<E extends IPluginRuntimeEvent = IPluginRuntimeEvent> = Record<
  string,
  IPluginRuntimeEventListener<E>
>;

export const loggingEventName = 'log';
export interface LoggingEvent extends IPluginRuntimeEvent {
  level: LogLevel;
  value: unknown;
}
export type LoggingEventListener = IPluginRuntimeEventListener<LoggingEvent>;

export const runtimeCloneParentEventName = 'runtime-clone-parent';
export interface RuntimeCloneParentEvent extends IPluginRuntimeEvent {
  parent: IPluginRuntime;
  child: IPluginRuntime;
}
export type RuntimeCloneParentEventListener = IPluginRuntimeEventListener<RuntimeCloneParentEvent>;

export const runtimeCloneChildEventName = 'runtime-clone-child';
export interface RuntimeCloneChildEvent extends IPluginRuntimeEvent {
  parent: IPluginRuntime;
  child: IPluginRuntime;
}
export type RuntimeCloneChildEventListener = IPluginRuntimeEventListener<RuntimeCloneChildEvent>;

// Emitted only on dynamic addCommand() calls, silent on initial command list population.
export const runtimeNewCommandAddedEventName = 'runtime-new-command-added';
export interface RuntimeNewCommandAddedEvent extends IPluginRuntimeEvent {
  plugin: string;
  command: string;
}
export type RuntimeNewCommandAddedEventListener = IPluginRuntimeEventListener<RuntimeNewCommandAddedEvent>;

export interface Plugin<E extends IPluginRuntimeEvent = IPluginRuntimeEvent> {
  name: string;
  eventListeners?: IPluginRuntimeEventListeners<E>;
  assets?: Assets;
  commands?: Commands;
}

export type PluginRecord = Record<string, Plugin>;

export interface IPluginRuntime {
  plugins: PluginRecord;
  pluginNames: string[];
  commandNames: string[];
  commandNameSet: Set<string>;
  assetNames: string[];
  commands: Commands;
  assets: Assets;
  clone: () => IPluginRuntime;
  emit: <E extends IPluginRuntimeEvent>(eventName: string, event: E) => boolean;
  pushContext: <T>(id: string, data: T) => T;
  popContext: <T>(id: string) => T | undefined;
  getContext: <T>(id: string) => T | undefined;
  addCommand: (pluginName: string, commandName: string, command: Command) => void;
  runCommands: (input: string | Readable, args: Arguments) => Promise<string | Readable>;
}

export async function runCommandsInContext<T>(
  runtime: IPluginRuntime,
  input: string | Readable,
  program: Arguments,
  id: string,
  data: T
): Promise<string | Readable> {
  runtime.pushContext(id, data);
  return runtime.runCommands(input, program).finally(() => {
    runtime.popContext(id);
  });
}

// Lazy. Too low-level. Rearchitect.
export async function commandArgument(
  runtime: IPluginRuntime,
  arg: string | Arguments | undefined,
  usage: string,
  input: string | Readable = ''
): Promise<string> {
  if (arg === undefined) {
    return fail(usage);
  }

  if (!Array.isArray(arg)) {
    return arg;
  }

  return readableToString(await runtime.runCommands(input, arg));
}

export type SpawnOptions = {
  /** Extra CLI flags to pass to the spawned command. */
  args?: string[];
  /** Milliseconds to wait before SIGTERM. */
  timeout?: number;
  shell?: boolean | string | undefined;
};

/**
 * Run an arbitrary command, streaming `input` into its stdin.
 * Resolves with the trimmed stdout or rejects on non-zero exit / timeout.
 */
export async function spawnText(cmd: string, input: Readable | string, opts: SpawnOptions = {}): Promise<string> {
  const { args = [], timeout } = opts;

  const child = spawn(cmd, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: opts.shell,
  });

  if (timeout) {
    const timer = setTimeout(() => child.kill('SIGTERM'), timeout);
    child.on('exit', () => clearTimeout(timer));
  }

  // Feed stdin
  if (input) {
    await pipeline(typeof input === 'string' ? Readable.from(input) : input, child.stdin!);
  } else {
    child.stdin!.end();
  }

  // Collect output
  const stdout: Buffer[] = [];
  const stderr: Buffer[] = [];
  child.stdout!.on('data', (c) => stdout.push(c));
  child.stderr!.on('data', (c) => stderr.push(c));

  return new Promise<string>((resolve, reject) => {
    child.on('close', (code) => {
      const out = Buffer.concat(stdout).toString('utf8').trimEnd();
      const err = Buffer.concat(stderr).toString('utf8').trimEnd();

      if (code === 0) resolve(out);
      else reject(new Error(`${cmd} exited ${code}: ${err || out}`));
    });

    child.on('error', reject);
  });
}

export class PluginError extends Error {}

export class PluginRuntimeFailure extends PluginError {}

export function fail(message: string): never {
  throw new PluginRuntimeFailure(message);
}

export async function readableToString(readable: Readable | string): Promise<string> {
  if (!(readable instanceof Readable)) {
    return String(readable);
  }

  let result = '';
  // Readable supports async iteration out-of-the-box in Node 18+
  for await (const chunk of readable) {
    // chunk is a Buffer; convert to string as you go
    result += chunk.toString('utf8');
  }
  return result;
}

// Lazy. Optimizable. Should we store file paths and load on demand?
export function loadAssets(dirname: string, options?: GlobOptions) {
  // Lazy. Should support ignores etc.
  const filenames = globSync('**/*', { ...options, cwd: dirname, nodir: true });
  return Object.fromEntries(filenames.map((f) => [f, readFileSync(resolve(dirname, String(f)), 'utf-8')]));
}

export function loadModuleAssets(importMetaUrl: string, options?: GlobOptions, subdir: string = '../assets') {
  const dir = dirname(fileURLToPath(importMetaUrl));
  return loadAssets(resolve(dir, subdir), options);
}

export function assetGlob(runtime: IPluginRuntime, pattern: string, options?: MinimatchOptions): AssetURI[] {
  const filter = minimatch.filter(pattern, options);
  return runtime.assetNames.filter(filter);
}

export function arrayWrap<T>(item: T): Array<T> {
  if (item === undefined) {
    return [];
  }
  if (Array.isArray(item)) {
    return item;
  }
  return [item];
}

export function resolveAsset(runtime: IPluginRuntime, uri: string): Asset | undefined {
  if (uri.startsWith('plugin:')) {
    return runtime.assets[uri];
  }

  if (uri.startsWith('file:///')) {
    // Lazy. Return undefined if file is not found.
    return readFileSync(fileURLToPath(uri), 'utf-8');
  }

  if (uri.startsWith('.') || uri.startsWith('/') || uri.endsWith('.yaml')) {
    // Lazy. Return undefined if file is not found.
    return readFileSync(uri, 'utf-8');
  }

  return undefined; // You may want to use assetGlob next.
}

export function resolvePluginAsset(runtime: IPluginRuntime, uri: string, pattern: string): Asset | undefined {
  const assetNames = assetGlob(runtime, pattern).sort();
  const assetName = assetNames[0]; // We handle not found below.
  const asset = runtime.assets[assetName];
  if (assetNames.length > 1) {
    process.emitWarning(`run: several assets found for "${uri}":\n* ${assetNames.join('\n* ')}\nUsing "${assetName}"`);
  }
  return asset;
}

export function resolveAssetSubdir(runtime: IPluginRuntime, uri: string, subdir: string): Asset | undefined {
  // Unqualified URIs are loaded from plugins.
  // Use dot notation (./dir/filename.yaml) or an absolute path (/path/to/filename.yaml) to load from filesystem
  return resolveAsset(runtime, uri) ?? resolvePluginAsset(runtime, uri, `plugin:*/**/${subdir}/**/${uri}.yaml`);
}

export function getPlugin<T extends Plugin>(runtime: IPluginRuntime, name: string): T {
  const plugin = runtime.plugins[name];
  if (!plugin) {
    fail(`getPlugin: plugin "${name}" not available, try installing it as the node package`);
  }
  return plugin as T;
}
