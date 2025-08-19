import { type Arguments, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import { listTestSuites } from '../lib/index.ts';

export const command = 'discover-tests';
export const description = 'replaces input with the list of available tests in JSON';
export const usage = 'usage: discover-tests';

export async function run(
  _input: string | Readable,
  _args: Arguments,
  runtime: IPluginRuntime
): Promise<string | Readable> {
  const tests = listTestSuites(runtime).sort();
  return `${JSON.stringify(tests)}\n`;
}
