import { type Arguments, commandArgument, type Command, fail, type IPluginRuntime, readableToString } from '@or-q/lib';
import { type Readable } from 'node:stream';

const usage = 'usage: temperature "<number in [0..2]>"';

const command: Command = {
  description: 'changes conversation object temperature',
  usage,
  tags: ['data'],
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const temperatureStr: string = await commandArgument(runtime, args.shift(), usage);
    if (Number.isNaN(Number(temperatureStr))) {
      return fail(`temperature: expected number in [0..2], got ${temperatureStr} (${typeof temperatureStr})`);
    }
    const temperature = Number(temperatureStr);
    if (temperature < 0 || temperature > 2) {
      return fail(`temperature: expected number in [0..2], got ${temperature}`);
    }

    // Lazy. Should validate input and argument
    const conversation = JSON.parse(await readableToString(input));

    conversation.temperature = temperature;

    return JSON.stringify(conversation, null, 2);
  },
};

export default command;
