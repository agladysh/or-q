import { type Arguments, commandArgument, type Command, type IPluginRuntime } from '@or-q/lib';
import { type Readable } from 'node:stream';

const usage = 'usage: conversation "<model>"';

const command: Command = {
  description: 'replaces input with an empty conversation object',
  usage,
  run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const model = await commandArgument(runtime, args.shift(), usage);

    return JSON.stringify({
      model: model,
      messages: [],
    });
  },
};

export default command;
