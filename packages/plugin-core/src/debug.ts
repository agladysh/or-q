import { type Arguments, type Commands, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';

const commands: Commands = {
  dump: {
    description: 'replaces input with remaining program dump',
    run: async (_input: string | Readable, args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
      return `${JSON.stringify(args)}\n`;
    },
  },
  rem: {
    description: 'consumes all remaining arguments and replaces input with them in JSON',
    run: async (_input: string | Readable, args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
      const consumed = args.splice(0, args.length);
      return `${JSON.stringify(consumed)}\n`;
    },
  },
};

export default commands;
