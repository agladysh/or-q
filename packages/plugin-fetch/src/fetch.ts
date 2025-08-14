import {
  type Arguments,
  commandArgument,
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
import yaml from 'yaml';
import pkg from '../package.json' with { type: 'json' };

// Lazy. DRY fetch implementations, cleanup sugar ones.
const commands: Commands = {
  ['fetch']: {
    description: 'fetches data from a provided URL, with input as request body',
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const usage = 'usage: fetch-json "<url>"';
      const url = await commandArgument(runtime, args.shift(), usage);
      const response = await fetch(url, yaml.parse(await readableToString(input))); // Lazy. Should validate input.
      if (!response.body) {
        console.error(response);
        return fail(`fetch: response body is null`);
      }
      // Lazy. Must handle HTTP code (esp. 429), in this handler and in others
      runtime.emit(loggingEventName, {
        source: pkg.name,
        level: logLevels.spam,
        value: ['fetch', response],
      } as LoggingEvent);
      return Readable.fromWeb(response.body as ReadableStream);
    },
  },
};

export default commands;
