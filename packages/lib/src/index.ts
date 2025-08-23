import { globSync, type GlobOptions } from 'glob';
import { minimatch, type MinimatchOptions } from 'minimatch';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import pkg from '../package.json' with { type: 'json' };
import parseArgsStringToArgv from 'string-argv';
import yaml from 'yaml';

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

/**
 * @deprecated: refactor to IProgram
 */
// Lazy. Legacy. Should be internal to Program.
export type Arguments = (string | Arguments)[];

export interface Command {
  description: string;
  run: (input: string | Readable, program: IProgram) => Promise<string | Readable>;
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
  runProgram: (input: string | Readable, program: Program) => Promise<string | Readable>;
}

export interface IProgramAtom {
  toStringWithInput: (input: string | Readable) => Promise<string>; // Lazy. Legacy, refactor away.
  toString: () => Promise<string>;
  toNumber: () => Promise<number>;
  toCommand: () => Promise<string>;
  toProgram: () => Promise<IProgram>;
  toFlatArray: () => Promise<string[]>;
  toObject: <T>() => Promise<T>;
}

export interface IProgram {
  runtime: IPluginRuntime;
  clone: () => IProgram;
  cloneRemaining: () => IProgram;
  cloneWithRuntime: () => IProgram;
  next: () => IProgramAtom | undefined;
  ensureNext: (error: string) => IProgramAtom;
  run: (input: string | Readable) => Promise<string | Readable>;
  runInContext: <T>(input: string | Readable, id: string, data: T) => Promise<string | Readable>;
  trace: () => string;
  fail: (message: string) => never;
  toString: () => string;
  toJSON: () => string;
  rem: () => void;
}

export function getContext<T>(runtime: IPluginRuntime, id: string, defaultContext: T): T {
  const context = runtime.getContext<T>(id);
  if (context !== undefined) {
    return context;
  }
  runtime.pushContext(id, defaultContext);
  return defaultContext;
}

export const atomsContextID = `context:${pkg.name}:atoms`;

export type AtomMap = Record<string, string>;

function getAtomMap(runtime: IPluginRuntime) {
  return getContext<AtomMap>(runtime, atomsContextID, {});
}

// Lazy. Move to core.
export class ProgramAtom implements IProgramAtom {
  private program: IProgram;
  private arg: string | Arguments; // Lazy. Hide behind remapping getter, and retire get() below.

  private get(): string | Arguments {
    if (typeof this.arg !== 'string') {
      return this.arg;
    }
    return getAtomMap(this.program.runtime)[this.arg] ?? this.arg;
  }

  constructor(program: IProgram, arg: string | Arguments) {
    this.program = program;
    this.arg = arg;
  }

  private fail(message: string): never {
    return this.program.fail(message);
  }

  // Lazy. Try to remove all users that need input here, and refactor away.
  async toStringWithInput(input: string | Readable): Promise<string> {
    const arg = this.get();
    if (typeof arg === 'string') {
      return arg;
    }
    const program = await this.toProgram();
    return readableToString(await program.run(input));
  }

  async toString(): Promise<string> {
    return this.toStringWithInput('');
  }

  async toNumber(): Promise<number> {
    const str = this.toString();
    const result = Number(str);
    if (Number.isNaN(result)) {
      return this.fail(`${str} is not a number`);
    }
    return result;
  }

  async toCommand(): Promise<string> {
    const result = await this.toString();
    if (!this.program.runtime.commandNameSet.has(result)) {
      return this.fail(`Unknown command "${result}"`);
    }
    return result;
  }

  async toProgram(): Promise<IProgram> {
    const arg = this.get();
    if (typeof arg === 'string') {
      return Program.fromArgv(this.program.runtime, arg);
    }

    if (!Array.isArray(arg)) {
      return this.fail(`${arg} is not a program`);
    }

    return new Program(this.program.runtime, arg);
  }

  async toFlatArray(): Promise<string[]> {
    const arg = this.get();
    if (typeof arg === 'string') {
      return parseArgsStringToArgv(arg);
    }

    if (!Array.isArray(arg)) {
      return this.fail(`${arg} is not an array`);
    }

    return arg.map((item) => (typeof item === 'string' ? item : fail(`${item} is not string`)));
  }

  async toObject<T>(): Promise<T> {
    return yaml.parse(await this.toString());
  }
}

// Lazy. Reuse something?
export function truncate(str: string, maxlen: number, suffix: string = '...') {
  if (str.length <= maxlen) {
    return str;
  }
  return `${str.substring(0, maxlen)}${suffix}`;
}

// Lazy. Move to core.
export class Program implements IProgram {
  public runtime: IPluginRuntime;
  private original: Arguments;
  private args: Arguments;

  constructor(runtime: IPluginRuntime, args: Arguments) {
    this.original = args;
    this.runtime = runtime;
    this.args = this.original.slice();
  }

  clone(): IProgram {
    return new Program(this.runtime, this.original);
  }

  cloneRemaining(): IProgram {
    return new Program(this.runtime, this.args);
  }

  cloneWithRuntime(): IProgram {
    return new Program(this.runtime.clone(), this.original);
  }

  next(): IProgramAtom | undefined {
    const arg = this.args.shift();
    if (arg === undefined) {
      return undefined;
    }
    return new ProgramAtom(this, arg);
  }

  ensureNext(error: string): IProgramAtom {
    const result = this.next();
    if (result !== undefined) {
      return result;
    }
    return this.fail(error);
  }

  async run(input: string | Readable): Promise<string | Readable> {
    return this.runtime.runProgram(input, this);
  }

  async runInContext<T>(input: string | Readable, id: string, data: T): Promise<string | Readable> {
    this.runtime.pushContext(id, data);
    return this.run(input).finally(() => {
      this.runtime.popContext(id);
    });
  }

  trace(): string {
    let result = '';
    const program = this.original;
    const args = this.args;
    const failedAt = program.length - args.length - 1;
    for (let i = 0; i < program.length; ++i) {
      const open = i === failedAt ? '> ' : '  ';
      const close = i === failedAt ? ' <' : '';
      // Lazy, compute maximum padding.
      result += `${i.toString().padStart(3)}: ${open}${truncate(String(program[i]).trim(), 60)}${close}\n`;
    }
    return result;
  }

  fail(message: string): never {
    return fail(`program trace:\n\n${this.trace()}\n${message}$`);
  }

  toString(): string {
    // Lazy. Should somehow return in format which we can parse back.
    return this.original.join(' ');
  }

  toJSON(): string {
    // Lazy. Should somehow return in format which we can parse back.
    return JSON.stringify(this.original);
  }

  rem(): void {
    this.args.splice(0, this.args.length);
  }

  static fromArgv(runtime: IPluginRuntime, argv: string | string[]): IProgram {
    if (!Array.isArray(argv)) {
      argv = parseArgsStringToArgv(argv);
    }
    return new Program(runtime, argv);
  }
}

/**
 * @deprecated: use Program.runInContext()
 */
// Lazy. Legacy. Refactor away.
export async function runCommandsInContext<T>(
  input: string | Readable,
  program: Program,
  id: string,
  data: T
): Promise<string | Readable> {
  return program.runInContext<T>(input, id, data);
}

/**
 * @deprecated: use Program.ensureNext(usage).toString()
 */
// Lazy. Legacy. Refactor away.
export async function commandArgument(program: Program, usage: string, input: string | Readable = ''): Promise<string> {
  const atom = program.ensureNext(usage);
  return atom.toStringWithInput(input);
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
  for await (const chunk of readable) {
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
