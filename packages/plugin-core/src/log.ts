import {
  type Arguments,
  type Command,
  commandArgument,
  type Commands,
  type IPluginRuntime,
  type LoggingEvent,
  loggingEventName,
  type LogLevel,
  logLevelNames,
} from '@or-q/lib';
import type { Readable } from 'node:stream';
import pkg from '../package.json' with { type: 'json' };

// Lazy. Use a wrapper in @org-q/lib

function logCommandEntry(level: LogLevel): [string, Command] {
  return [
    level,
    {
      description: `logs text with ${level} level, forwards input`,
      run: async (
        input: string | Readable,
        args: Arguments,
        runtime: IPluginRuntime
      ) => {
        const text = await commandArgument(
          runtime,
          args.shift(),
          `usage: ${level} "<text>"`
        );
        runtime.emit(loggingEventName, {
          source: pkg.name,
          level: level,
          value: text,
        } as LoggingEvent);
        return input;
      },
    },
  ];
}

const commands: Commands = Object.fromEntries(
  logLevelNames.map(logCommandEntry)
);

export default commands;
