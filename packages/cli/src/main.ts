#! /usr/bin/env node --env-file-if-exists=.env --experimental-strip-types --disable-warning=ExperimentalWarning
import { PluginRuntime } from '@or-q/core';
import { PluginRuntimeFailure, readableToString } from '@or-q/lib';
import type { Readable } from 'node:stream';

async function main() {
  const runtime = await PluginRuntime.fromNodeModules();

  const args = process.argv.slice(2);
  if (args.length === 0) {
    // Check if help command is available
    if (runtime.commands['help']) {
      try {
        const helpOutput = await readableToString(await runtime.runCommands('', ['help']));
        process.stdout.write(`OR-Q CLI\n\n${helpOutput}\n`);
        return;
      } catch {
        // Fall back to basic usage if help command fails
      }
    }
    process.stdout.write(
      `OR-Q CLI\n\nUsage: pnpm or-q <command> [args...]\n\nInstall @or-q/plugin-help for more information.\n`
    );
    return;
  }

  let input: string | Readable = '';

  try {
    input = await readableToString(await runtime.runCommands(input, args));
  } catch (e: unknown) {
    if (e instanceof PluginRuntimeFailure) {
      process.stderr.write(`${e.message.trimEnd()}\n`);
      return;
    }
  }

  input = input.trimEnd();
  if (input !== '') {
    process.stdout.write(`${input}\n`);
  }
}

main().catch((e: unknown) => {
  console.error('Unexpected error:', e);
});
