import { type Arguments, commandArgument, type Command, type IPluginRuntime, readableToString } from '@or-q/lib';
import { type Readable } from 'node:stream';

const usage = 'usage: system "<message>"';

const command: Command = {
  description: 'appends system message to an conversation object in input',
  usage,
  tags: ['data'],
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const content = await commandArgument(runtime, args.shift(), usage);

    // Lazy. Should validate input
    const conversation = JSON.parse(await readableToString(input));
    conversation.messages.push({ role: 'system', content: content });

    return JSON.stringify(conversation, null, 2);
  },
};

export default command;
