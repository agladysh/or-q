import { type Arguments, type Command, fail, type IPluginRuntime } from '@or-q/lib';
import { Readable } from 'node:stream';
import type { ReadableStream } from 'stream/web';

const url = 'https://openrouter.ai/api/v1/models';
const options = { method: 'GET' };

const command: Command = {
  description: 'replaces input with data from OpenResty models endpoint',
  usage: 'usage: models',
  tags: ['utility'],
  run: async (_input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
    const response = await fetch(url, options);
    if (!response.body) {
      console.error(response);
      return fail(`models: response body is null`);
    }
    return Readable.fromWeb(response.body as ReadableStream);
  },
};

export default command;
