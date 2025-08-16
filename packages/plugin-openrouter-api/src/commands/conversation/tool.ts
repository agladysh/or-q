import { type Arguments, commandArgument, type Command, type IPluginRuntime, readableToString } from '@or-q/lib';
import { type Readable } from 'node:stream';

const usage = 'usage: tool "<message>"';

const command: Command = {
  description: 'appends tool message to an conversation object in input',
  usage,
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const content = await commandArgument(runtime, args.shift(), usage);

    // Lazy. Should validate input
    const conversation = JSON.parse(await readableToString(input));
    conversation.messages.push({ role: 'tool', content: content });

    return JSON.stringify(conversation, null, 2);
  },
};

export default command;
