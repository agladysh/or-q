import { fail, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import parseArgsStringToArgv from 'string-argv';

const usage = 'usage: forever [actions]';

const command: Command = {
  description: 'runs forever, interrupt to exit',
  usage,
  tags: ['utility'],
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    // Not using commandArgument() helper, since we do NOT want sub-command expansion here.
    let arg = args.shift();
    if (arg === undefined) {
      return fail(usage);
    }
    if (typeof arg === 'string') {
      arg = parseArgsStringToArgv(arg);
    }
    while (true) {
      input = await runtime.runCommands(input, arg.slice());
    }
  },
};

export default command;
