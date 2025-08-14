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

const generateUrl = 'http://localhost:11434/api/generate';
const chatUrl = 'http://localhost:11434/api/chat';

// Lazy. DRY implementations.
const commands: Commands = {
  ['ollama-generate']: {
    description: 'feeds input in the native Ollama format to the local Ollama instance generate REST API',
    run: async (input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const response = await fetch(generateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: await readableToString(input), // Lazy. Should validate input.
      });
      if (!response.body) {
        console.error(response);
        fail(`ollama-generate: response body is null`);
      }
      // Lazy. Must handle HTTP code (esp. 429), in this handler and in others
      runtime.emit(loggingEventName, {
        source: pkg.name,
        level: logLevels.spam,
        value: ['ollama-generate', response],
      } as LoggingEvent);
      return Readable.fromWeb(response.body as ReadableStream);
    },
  },
  ['ollama-chat']: {
    description: 'feeds input in the native Ollama format to the local Ollama instance chat REST API',
    run: async (input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: await readableToString(input), // Lazy. Should validate input.
      });
      if (!response.body) {
        console.error(response);
        fail(`ollama-generate: response body is null`);
      }
      // Lazy. Must handle HTTP code (esp. 429), in this handler and in others
      runtime.emit(loggingEventName, {
        source: pkg.name,
        level: logLevels.spam,
        value: ['ollama-chat', response],
      } as LoggingEvent);
      return Readable.fromWeb(response.body as ReadableStream);
    },
  },
};

export default commands;
