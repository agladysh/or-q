import {
  readableToString,
  type Arguments,
  type Commands,
  type IPluginRuntime,
} from '@or-q/lib';
import type { Readable } from 'node:stream';

const commands: Commands = {
  unquote: {
    description: 'unquotes input JSON string (useful in conjunction with jp)',
    run: async (
      input: string | Readable,
      _args: Arguments,
      _runtime: IPluginRuntime
    ): Promise<string | Readable> => {
      input = await readableToString(input);
      return JSON.parse(input);
    },
  },
};

export default commands;
