#! /usr/bin/env node --experimental-strip-types --disable-warning=ExperimentalWarning
import { Readable } from 'node:stream';
import { loadAllPlugins } from '@or-q/core';
import { fail, readableToString } from '@or-q/lib';

async function main() {
  const plugins = await loadAllPlugins();
  const { commands } = plugins;

  const args = process.argv.slice(2);
  if (args.length === 0) {
    // Lazy: should write full help
    process.stdout.write(
      `Available commands: ${Object.keys(commands).join(', ')}\n`
    );
    return;
  }

  let input: string | Readable = '';

  while (args.length > 0) {
    const command = args.shift()!;
    if (!(command in commands)) {
      fail(`Unknown command ${command}`);
    }
    // Lazy, implicit arg eating sucks.
    input = await commands[command].run(input, args); // This will eat more args
  }

  if (input instanceof Readable) {
    input = await readableToString(input);
  }

  process.stdout.write(input.endsWith('\n') ? input : `${input}\n`);
}

main().catch((e: unknown) => {
  console.error('Unexpected error:', e);
});
