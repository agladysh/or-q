import {
  commandArgument,
  fail,
  runCommandsInContext,
  type Arguments,
  type Command,
  type IPluginRuntime,
} from '@or-q/lib';
import type { Readable } from 'node:stream';
import yaml from 'yaml';
import { macros, contextID, type Context } from '../utils.ts';

const usage = 'usage: $macro [<macro>, ...args]';

const command: Command = {
  description: 'invokes macro',
  usage,
  tags: ['utility'],
  run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
    const arg = args.shift();
    if (arg === undefined) {
      return fail(usage);
    }
    const invocation = (typeof arg === 'string' ? yaml.parse(arg) : arg) as Arguments;
    if (invocation.length < 1) {
      return fail(usage);
    }
    const name = await commandArgument(runtime, invocation[0], 'internal error: unreachable');
    const def = macros[name];
    if (!def) {
      return fail(`unknown macro "${name}"`);
    }

    const resolved: Arguments = [];
    for (const arg of invocation) {
      resolved.push(await commandArgument(runtime, arg, 'internal error: unreachable'));
    }

    // Lazy. Do proper deep clone instead of JSON serialization.
    return await runCommandsInContext<Context>(runtime, input, JSON.parse(JSON.stringify(def)), contextID, {
      args: resolved,
    });
  },
};

export default command;
