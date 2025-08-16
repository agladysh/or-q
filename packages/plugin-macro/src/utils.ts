import { type Arguments } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

export type Defs = Record<string, Arguments>;
export const macros: Defs = {};

export const contextID = `context:${pkg.name}:$macro`;
export type Context = { args: Arguments };
