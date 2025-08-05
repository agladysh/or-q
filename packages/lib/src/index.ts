import { spawn } from 'node:child_process';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export interface Command {
  description: string;
  run: (input: string | Readable, args: string[]) => Promise<string | Readable>;
}

export type Commands = Record<string, Command>;

export interface Plugin {
  name: string;
  commands?: Commands;
}

export type SpawnOptions = {
  /** Extra CLI flags to pass to the spawned command. */
  args?: string[];
  /** Milliseconds to wait before SIGTERM. */
  timeout?: number;
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

  const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });

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
