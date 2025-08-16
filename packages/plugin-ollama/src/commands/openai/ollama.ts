import {
  type Arguments,
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
import pkg from '../../../package.json' with { type: 'json' };

const url = 'http://localhost:11434/v1/chat/completions';
const usage = 'usage: ollama';

const command: Command = {
  description: 'feeds OpenAI-compatible input to the local Ollama instance OpenAI completions API wrapper',
  usage,
  tags: ['utility'],
  run: async (input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: await readableToString(input), // Lazy. Should validate input.
    });
    if (!response.body) {
      console.error(response);
      return fail(`ollama: response body is null`);
    }
    // Lazy. Must handle HTTP code (esp. 429), in this handler and in others
    runtime.emit(loggingEventName, {
      source: pkg.name,
      level: logLevels.spam,
      value: ['ollama', response],
    } as LoggingEvent);
    return Readable.fromWeb(response.body as ReadableStream);
  },
};

export default command;
