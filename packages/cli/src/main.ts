#! /usr/bin/env node --env-file-if-exists=.env --experimental-strip-types --disable-warning=ExperimentalWarning
import { PluginRuntime } from '@or-q/core';
import { readableToString } from '@or-q/lib';
import type { Readable } from 'node:stream';

async function main() {
  const runtime = await PluginRuntime.fromNodeModules();

  const args = process.argv.slice(2);
  if (args.length === 0) {
    // Lazy: should write full help
    process.stdout.write(`${runtime.usage()}\n`);
    return;
  }

  let input: string | Readable = '';

  input = await readableToString(await runtime.runCommands(input, args));

  input = input.trimEnd();
  if (input !== '') {
    process.stdout.write(`${input}\n`);
  }
}

main().catch((e: unknown) => {
  console.error('Unexpected error:', e);
});
