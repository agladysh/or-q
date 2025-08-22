import type { Arguments, IPluginRuntime } from '@or-q/lib';
import { commandArgument, readableToString } from '@or-q/lib';
import type { Readable } from 'node:stream';
import { renderORQ } from '../lib/index.ts';

export const command = 'f';
export const description = 'replaces input with a template instantiated from @orq/store, feeding it input';
export const usage = 'usage: f "[template]"';

export async function run(
  input: string | Readable,
  args: Arguments,
  runtime: IPluginRuntime
): Promise<string | Readable> {
  const template = await commandArgument(runtime, args.shift(), usage);

  input = await readableToString(input); // Reading it as string to preserve stream.

  return renderORQ(runtime, template, input);
}
