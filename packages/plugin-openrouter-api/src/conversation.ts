import { type Commands, fail, readableToString } from '@or-q/lib';
import { type Readable } from 'node:stream';

function messageHandler(
  command: string,
  role: 'system' | 'user' | 'assistant' | 'tool'
) {
  return async function run(
    input: string | Readable,
    args: string[]
  ): Promise<string | Readable> {
    const content = args.shift();
    // Lazy, this should be enforced by caller, including usage.
    if (content === undefined) {
      fail(`usage: ${command} "<message>"`);
    }

    // Lazy. Should validate input
    const conversation = JSON.parse(await readableToString(input));
    conversation.messages.push({ role: role, content: content });

    return JSON.stringify(conversation, null, 2);
  };
}

const commands: Commands = {
  conversation: {
    description: 'replaces input with an empty conversation object',
    run: async (
      _input: string | Readable,
      args: string[]
    ): Promise<string | Readable> => {
      const model = args.shift();
      // Lazy, this should be enforced by caller, including usage.
      if (model === undefined) {
        fail('usage: conversation "<model>"');
      }

      return JSON.stringify({
        model: model,
        messages: [],
      });
    },
  },
  system: {
    description: 'appends system message to an conversation object in input',
    run: messageHandler('system', 'system'),
  },
  user: {
    description: 'appends user message to an conversation object in input',
    run: messageHandler('user', 'user'),
  },
  assistant: {
    description: 'appends assistant message to an conversation object in input',
    run: messageHandler('assistant', 'assistant'),
  },
  tool: {
    description: 'appends tool message to an conversation object in input',
    run: messageHandler('tool', 'tool'),
  },
};

export default commands;
