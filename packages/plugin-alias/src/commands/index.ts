import pkg from '../../package.json' with { type: 'json' };
import { commandsFromImports } from '@or-q/lib';

import * as alias from './alias.ts';

const commands = commandsFromImports(pkg.name, alias);

export default commands;
