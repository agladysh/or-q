import pkg from '../../package.json' with { type: 'json' };
import { commandsFromImports } from '@or-q/lib';

import * as f from './f.ts';
import * as log from './log.ts';
import * as render from './render.ts';
import * as t from './t.ts';

const commands = commandsFromImports(pkg.name, f, log, render, t);

export default commands;
