import { commandArgument, fail, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import { contextID, type Context } from '../utils.ts';

const usage = 'usage: $arg <n>';

const command: Command = {
  description: 'macro argument placeholder',
  usage,
  tags: ['utility'],
  run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const argStr = await commandArgument(runtime, args.shift(), usage);
    const argno = Number(argStr);
    if (!Number.isInteger(argno)) {
      return fail(usage);
    }

    const context = runtime.getContext<Context>(contextID);
    if (!context) {
      return fail('attempted to run $arg command outside of $macro command context');
    }

    return await commandArgument(
      runtime,
      context.args[argno],
      `no $arg number ${argno} found in ${JSON.stringify(args)}`
    );
  },
};

export default command;
