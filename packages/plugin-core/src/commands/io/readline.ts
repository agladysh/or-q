import { commandArgument, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import { createInterface } from 'node:readline/promises';
import type { Readable } from 'node:stream';

const usage = 'usage: readline "<prompt>"';

const command: Command = {
  description: 'replaces input with a line from stdin',
  usage,
  tags: ['io'],
  run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const readline = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const prompt = await commandArgument(runtime, args.shift(), usage);
    const answer = await readline.question(prompt);
    readline.close();
    return answer;
  },
};

export default command;
