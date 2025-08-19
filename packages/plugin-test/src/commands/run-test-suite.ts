import { fail, readableToString, type Arguments, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import { loadTestSuiteAsset, resolveTestSuiteAsset, runTestSuite } from '../lib/index.ts';

export const command = 'run-test-suite';
export const description = 'runs a test suite from filesystem or assets';
export const usage = 'usage: echo "<name>" | run-test-suite';

// Lazy: Read additional parameters (fail on first error, individual test name, concurrency, timeout) from process.env?

export async function run(
  input: string | Readable,
  _args: Arguments,
  runtime: IPluginRuntime
): Promise<string | Readable> {
  const uri = await readableToString(input);
  const asset = resolveTestSuiteAsset(runtime, uri);
  if (!asset) {
    return fail(`test ${uri} not found. did you mean ./${uri}?`);
  }

  const suite = loadTestSuiteAsset(asset);

  return runTestSuite(runtime, suite); // Lazy. Shouldn't this return machine-readable YAML or JSONL?
}
