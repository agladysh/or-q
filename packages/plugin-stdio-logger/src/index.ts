import {
  commandArgument,
  fail,
  type IPluginRuntimeEventListener,
  type IProgram,
  loadModuleAssets,
  type LoggingEvent,
  loggingEventName,
  logLevelNames,
  type LogLevelOrd,
  logLevelOrds,
  logLevels,
  type Plugin,
} from '@or-q/lib';
import { Console } from 'node:console';
import type { Readable } from 'stream';
import pkg from '../package.json' with { type: 'json' };

export class LoggingPlugin implements Plugin {
  name: string = pkg.name;
  assets = loadModuleAssets(import.meta.url);

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
      run: async (input: string | Readable, program: IProgram): Promise<string | Readable> => {
        const usage = `usage: loglevel "${logLevelNames.join('|')}"`;
        const level = await commandArgument(runtime, args.shift(), usage);
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
