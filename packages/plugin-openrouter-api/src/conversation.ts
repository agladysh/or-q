import { type Arguments, commandArgument, type Commands, fail, type IPluginRuntime, readableToString } from '@or-q/lib';
import { type Readable } from 'node:stream';

function messageHandler(command: string, role: 'system' | 'user' | 'assistant' | 'tool') {
  return async function run(
    input: string | Readable,
    args: Arguments,
    runtime: IPluginRuntime
  ): Promise<string | Readable> {
    const content = await commandArgument(runtime, args.shift(), `usage: ${command} "<message>"`);

    // Lazy. Should validate input
    const conversation = JSON.parse(await readableToString(input));
    conversation.messages.push({ role: role, content: content });

    return JSON.stringify(conversation, null, 2);
  };
}

const commands: Commands = {
  conversation: {
    description: 'replaces input with an empty conversation object',
    usage: 'usage: conversation "<model>"',
    tags: ['data'],
    run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const model = await commandArgument(runtime, args.shift(), 'usage: conversation "<model>"');

      return JSON.stringify({
        model: model,
        messages: [],
      });
    },
  },
  system: {
    description: 'appends system message to an conversation object in input',
    usage: 'usage: system "<message>"',
    tags: ['data'],
    run: messageHandler('system', 'system'),
  },
  user: {
    description: 'appends user message to an conversation object in input',
    usage: 'usage: user "<message>"',
    tags: ['data'],
    run: messageHandler('user', 'user'),
  },
  assistant: {
    description: 'appends assistant message to an conversation object in input',
    usage: 'usage: assistant "<message>"',
    tags: ['data'],
    run: messageHandler('assistant', 'assistant'),
  },
  tool: {
    description: 'appends tool message to an conversation object in input',
    usage: 'usage: tool "<message>"',
    tags: ['data'],
    run: messageHandler('tool', 'tool'),
  },
  temperature: {
    description: 'changes conversation object temperature',
    usage: 'usage: temperature "<number in [0..2]>"',
    tags: ['data'],
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      const usage = 'usage: temperature "<number in [0..2]>"';
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
  },
};

export default commands;
