#! /usr/bin/env node --experimental-strip-types --disable-warning=ExperimentalWarning
import { loadAllPlugins } from '@or-q/core';
import { readableToString } from '@or-q/lib';
import { Readable } from 'node:stream';

async function main() {
  const plugins = await loadAllPlugins();

  const args = process.argv.slice(2);
  if (args.length === 0) {
    // Lazy: should write full help
    process.stdout.write(`${plugins.usage()}\n`);
    return;
  }

  let input: string | Readable = '';

  input = await plugins.runCommands(input, args);

  if (input instanceof Readable) {
    input = await readableToString(input);
  }

  process.stdout.write(input.endsWith('\n') ? input : `${input}\n`);
}

main().catch((e: unknown) => {
  console.error('Unexpected error:', e);
});
