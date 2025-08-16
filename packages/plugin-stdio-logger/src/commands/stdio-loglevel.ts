import {
  commandArgument,
  fail,
  logLevelNames,
  logLevelOrds,
  type Arguments,
  type Command,
  type IPluginRuntime,
} from '@or-q/lib';
import type { Readable } from 'node:stream';

const usage = `usage: stdio-loglevel "${logLevelNames.join('|')}"`;

// This will be a factory function that takes the plugin instance
export function createStdioLoglevelCommand(setLogLevel: (level: string) => void): Command {
  return {
    description: 'changes loglevel, useful for debugging',
    usage,
    tags: ['development'],
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const level = await commandArgument(runtime, args.shift(), usage);
      if (!(level in logLevelOrds)) {
        return fail(`unknown log level ${level}`);
      }
      setLogLevel(level);
      return input;
    },
  };
}
