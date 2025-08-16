import {
  type Arguments,
  commandArgument,
  type Command,
  type IPluginRuntime,
  type LoggingEvent,
  loggingEventName,
} from '@or-q/lib';
import type { Readable } from 'node:stream';
import pkg from '../../../package.json' with { type: 'json' };

const usage = 'usage: error "<text>"';

const command: Command = {
  description: 'logs text with error level, forwards input',
  usage,
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime) => {
    const text = await commandArgument(runtime, args.shift(), usage);
    runtime.emit(loggingEventName, {
      source: pkg.name,
      level: 'error',
      value: text,
    } as LoggingEvent);
    return input;
  },
};

export default command;
