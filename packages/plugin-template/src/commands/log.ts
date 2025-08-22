import {
  type Arguments,
  commandArgument,
  type Commands,
  type IPluginRuntime,
  type LoggingEvent,
  loggingEventName,
  type LogLevel,
  logLevelNames,
  readableToString,
} from '@or-q/lib';
import type { Readable } from 'node:stream';
import pkg from '../../package.json' with { type: 'json' };
import { renderORQ } from '../lib/index.ts';

// Lazy. Use a wrapper in @org-q/lib

function logCommandEntry(level: LogLevel): Commands {
  const command = `${level}-f`;
  const description = `instantiates and logs template with ${command} level, forwards input`;
  const usage = `usage: ${command} "<template>"`;
  return {
    [command]: {
      description,
      // usage,
      run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime) => {
        const template = await commandArgument(runtime, args.shift(), usage);
        input = await readableToString(input); // Reading stream to preserve the input value.
        const text = await renderORQ(runtime, template, input);
        runtime.emit(loggingEventName, {
          source: pkg.name,
          level: level,
          value: text,
        } as LoggingEvent);
        return input;
      },
    },
  };
}

const commands: Commands[] = logLevelNames.map(logCommandEntry);

export default commands;
