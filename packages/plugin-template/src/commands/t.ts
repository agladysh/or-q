import type { Arguments, IPluginRuntime } from '@or-q/lib';
import { commandArgument } from '@or-q/lib';
import type { Readable } from 'node:stream';
import { renderORQ } from '../lib/index.ts';

export const command = 't';
export const description = 'replaces input with a template instantiated from @orq/store';
export const usage = 'usage: t "[template]"';

export async function run(
  _input: string | Readable,
  args: Arguments,
  runtime: IPluginRuntime
): Promise<string | Readable> {
  const template = await commandArgument(runtime, args.shift(), usage);

  return renderORQ(runtime, template);
}
