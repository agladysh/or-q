import { Readable } from 'node:stream';
import { fail, type Command } from '@or-q/lib';
import type { ReadableStream } from 'stream/web';

export const name = 'models';

const url = 'https://openrouter.ai/api/v1/models';
const options = { method: 'GET' };

export const command: Command = {
  description: 'reads data from OpenResty models endpoint, ignoring input',
  run: async (
    _input: string | Readable,
    _args: string[]
  ): Promise<string | Readable> => {
    const response = await fetch(url, options);
    if (!response.body) {
      console.error(response);
      fail(`${name}: response body is null`);
    }
    return Readable.fromWeb(response.body as ReadableStream);
  },
};
