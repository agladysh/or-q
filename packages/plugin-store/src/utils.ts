import { type IPluginRuntime } from '@or-q/lib';
import type { Readable } from 'node:stream';
import pkg from '../package.json' with { type: 'json' };

const contextID = `context:${pkg.name}:store`;

export type Store = Record<string, string | Readable>;

export function getStore(runtime: IPluginRuntime): Store {
  let result = runtime.getContext<Store>(contextID);
  if (result !== undefined) {
    return result;
  }
  result = {};
  runtime.pushContext<Store>(contextID, result);
  return result;
}
