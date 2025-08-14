import {
  type Arguments,
  type IPluginRuntime,
  type IPluginRuntimeEventListener,
  type LoggingEvent,
  type LogLevelOrd,
  type Plugin,
  commandArgument,
  fail,
  loggingEventName,
  logLevelNames,
  logLevelOrds,
  logLevels,
} from '@or-q/lib';
import { Console } from 'node:console';
import type { Readable } from 'stream';
import pkg from '../package.json' with { type: 'json' };

export class LoggingPlugin implements Plugin {
  name: string = pkg.name;

  console = new Console(process.stdout, process.stderr);
  private logLevelOrd: LogLevelOrd = logLevelOrds[logLevels.log];

  eventListeners = {
    [loggingEventName]: ((event: LoggingEvent) => {
      if (logLevelOrds[event.level] < this.logLevelOrd) {
        return;
      }

      const prefix = `${event.level}\t${event.source.replace(/^.*?plugin-/, '')}\t`;

      if (Array.isArray(event.value)) {
        this.console.log(prefix, ...event.value);
        return;
      }

      this.console.log(prefix, event.value);
    }) as IPluginRuntimeEventListener, // Lazy. Remove this ugly typecast and fix typings.
  };

  commands = {
    // Lazy. Should be named
    ['stdio-loglevel']: {
      description: 'changes loglevel, useful for debugging',
      run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
        const level = await commandArgument(runtime, args.shift(), `usage: loglevel "${logLevelNames.join('|')}"`);
        if (!(level in logLevelOrds)) {
          return fail(`unknown log level ${level}`);
        }
        this.logLevelOrd = logLevelOrds[level];
        return input;
      },
    },
  };
}

const plugin = new LoggingPlugin();

export default plugin;
