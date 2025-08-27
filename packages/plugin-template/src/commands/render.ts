import type { IProgram } from '@or-q/lib';
import { readableToString } from '@or-q/lib';
import type { Readable } from 'node:stream';
import { renderORQ } from '../lib/index.ts';

export const command = 'render';
export const description = 'treats input as a template and instantiates it from @orq/store';
export const usage = 'usage: echo "<template>" | render';

export async function run(input: string | Readable, program: IProgram): Promise<string | Readable> {
  return renderORQ(program.runtime, await readableToString(input));
}
