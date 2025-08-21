#! /usr/bin/env node --env-file-if-exists=.env --experimental-strip-types --disable-warning=ExperimentalWarning
import { PluginRuntime } from '@or-q/core';
import { PluginRuntimeFailure } from '@or-q/lib';
import { Readable } from 'node:stream';

async function main() {
  const runtime = await PluginRuntime.fromNodeModules();

  const args = process.argv.slice(2);
  if (args.length === 0) {
    // Lazy: should write full help
    process.stdout.write(`${runtime.usage()}\n`);
    return;
  }

  try {
    const result = await runtime.runCommands(process.stdin, args);
    if (result === process.stdin && process.stdin.isTTY) {
      return;
    }

    if (result instanceof Readable) {
      for await (const chunk of result) {
        process.stdout.write(chunk);
      }
      return;
    }

    const output = result.trimEnd();
    if (output !== '') {
      process.stdout.write(`${output}\n`);
    }
  } catch (e: unknown) {
    if (e instanceof PluginRuntimeFailure) {
      process.stderr.write(`${e.message.trimEnd()}\n`);
      process.exitCode = 1;
      return;
    }
  }
}

main().catch((e: unknown) => {
  console.error('Unexpected error:', e);
  process.exitCode = 1;
});
