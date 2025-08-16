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

const usage = 'usage: log "<text>"';

const command: Command = {
  description: 'logs text with log level, forwards input',
  usage,
  tags: ['development'],
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime) => {
    const text = await commandArgument(runtime, args.shift(), usage);
    runtime.emit(loggingEventName, {
      source: pkg.name,
      level: 'log',
      value: text,
    } as LoggingEvent);
    return input;
  },
};

export default command;
