import {
  type Arguments,
  commandArgument,
  fail,
  type IPluginRuntime,
  type LoggingEvent,
  loggingEventName,
  logLevels,
  readableToString,
  type Command,
} from '@or-q/lib';
import { Readable } from 'node:stream';
import type { ReadableStream } from 'stream/web';
import yaml from 'yaml';
import pkg from '../../package.json' with { type: 'json' };

const usage = 'usage: fetch "<url>"';

const command: Command = {
  description: 'fetches data from a provided URL, with input as request body',
  usage,
  tags: [],
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const url = await commandArgument(runtime, args.shift(), usage);
    const config = yaml.parse(await readableToString(input)); // Lazy. Should validate input.

    // If body is an object and Content-Type is application/json, stringify the body
    if (
      config.body &&
      typeof config.body === 'object' &&
      config.headers &&
      config.headers['Content-Type'] === 'application/json'
    ) {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);
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
};

export default command;
