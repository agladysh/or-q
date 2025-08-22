import type { Arguments, IPluginRuntime } from '@or-q/lib';
import { readableToString } from '@or-q/lib';
import type { Readable } from 'node:stream';
import { renderORQ } from '../lib/index.ts';

export const command = 'render';
export const description = 'treats input as a template and instantiates it from @orq/store';
export const usage = 'usage: echo "<template>" | render';

export async function run(
  input: string | Readable,
  _args: Arguments,
  runtime: IPluginRuntime
): Promise<string | Readable> {
  return renderORQ(runtime, await readableToString(input));
}
