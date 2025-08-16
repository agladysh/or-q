import {
  type Arguments,
  type Commands,
  fail,
  type IPluginRuntime,
  type LoggingEvent,
  loggingEventName,
  logLevels,
  readableToString,
} from '@or-q/lib';
import { Readable } from 'node:stream';
import type { ReadableStream } from 'stream/web';
import pkg from '../package.json' with { type: 'json' };

const url = 'https://openrouter.ai/api/v1/chat/completions';

const commands: Commands = {
  completions: {
    description: 'feeds input to the OpenRouter completions API, requires OPENROUTER_API_KEY env variable',
    usage: 'usage: completions',
    tags: ['utility'],
    run: async (input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
      if (!OPENROUTER_API_KEY) {
        return fail('OPENROUTER_API_KEY environment variable is not set');
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
        return fail(`completions: response body is null`);
      }
      // Lazy. Must handle HTTP code (esp. 429), in this handler and in others
      runtime.emit(loggingEventName, {
        source: pkg.name,
        level: logLevels.spam,
        value: ['completions', response],
      } as LoggingEvent);
      return Readable.fromWeb(response.body as ReadableStream);
    },
  },
};

export default commands;
