import { globSync, type GlobOptions } from 'glob';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { minimatch, type MinimatchOptions } from 'minimatch';

export interface Command {
  description: string;
  run: (
    input: string | Readable,
    args: string[],
    runtime: IPluginRuntime
  ) => Promise<string | Readable>;
}

export type Commands = Record<string, Command>;
export type Assets = Record<string, string>;

export interface Plugin {
  name: string;
  assets?: Commands;
  commands?: Commands;
}

export interface IPluginRuntime {
  pluginNames: string[];
  commandNames: string[];
  assetNames: string[];
  commands: Commands;
  assets: Assets;
  usage: () => string;
  runCommands: (
    input: string | Readable,
    args: string[]
  ) => Promise<string | Readable>;
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
export async function spawnText(
  cmd: string,
  input: Readable | string,
  opts: SpawnOptions = {}
): Promise<string> {
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
    await pipeline(
      typeof input === 'string' ? Readable.from(input) : input,
      child.stdin!
    );
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

export function fail(message: string): never {
  process.stderr.write(message.endsWith('\n') ? message : `${message}\n`);
  process.exit(1);
}

export async function readableToString(
  readable: Readable | string
): Promise<string> {
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
  return Object.fromEntries(
    filenames.map((f) => [
      f,
      readFileSync(resolve(dirname, String(f)), 'utf-8'),
    ])
  );
}

export function loadModuleAssets(
  importMetaUrl: string,
  options?: GlobOptions,
  subdir: string = '../assets'
) {
  const dir = dirname(fileURLToPath(importMetaUrl));
  return loadAssets(resolve(dir, subdir), options);
}

export function assetGlob(
  runtime: IPluginRuntime,
  pattern: string,
  options?: MinimatchOptions
): string[] {
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

export function resolveAsset(
  runtime: IPluginRuntime,
  uri: string
): string | undefined {
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
