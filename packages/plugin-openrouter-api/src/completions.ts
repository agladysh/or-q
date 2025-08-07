import { type Commands, fail, readableToString } from '@or-q/lib';
import { Readable } from 'node:stream';
import type { ReadableStream } from 'stream/web';

const url = 'https://openrouter.ai/api/v1/chat/completions';

const commands: Commands = {
  completions: {
    description:
      'feeds input to the OpenRouter completions API, requires OPENROUTER_API_KEY env variable',
    run: async (
      input: string | Readable,
      _args: string[]
    ): Promise<string | Readable> => {
      const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
      if (!OPENROUTER_API_KEY) {
        fail('OPENROUTER_API_KEY environment variable is not set');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          // We may want to set these (and let user override)
          // 'HTTP-Referer': '<YOUR_SITE_URL>',
          // 'X-Title': '<YOUR_SITE_NAME>',
          'Content-Type': 'application/json',
        },
        body: await readableToString(input), // Lazy. Should validate input.
      });
      if (!response.body) {
        console.error(response);
        fail(`${name}: response body is null`);
      }
      return Readable.fromWeb(response.body as ReadableStream);
    },
  },
};

export default commands;
