import {
  type IPluginRuntimeEventListener,
  type LoggingEvent,
  type LogLevelOrd,
  type Plugin,
  loggingEventName,
  logLevelOrds,
  logLevels,
} from '@or-q/lib';
import { Console } from 'node:console';
import pkg from '../package.json' with { type: 'json' };
import { createStdioLoglevelCommand } from './commands/stdio-loglevel.ts';

export class LoggingPlugin implements Plugin {
  name: string = pkg.name;
  description: string = pkg.description;

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
    'stdio-loglevel': createStdioLoglevelCommand((level: string) => {
      this.logLevelOrd = logLevelOrds[level];
    }),
  };
}

const plugin = new LoggingPlugin();

export default plugin;
