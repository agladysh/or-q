import pkg from '../../package.json' with { type: 'json' };
import { commandsFromImports } from '@or-q/lib';

import * as discoverTests from './discover-tests.ts';
import * as runTests from './run-test-suite.ts';

const commands = commandsFromImports(pkg.name, discoverTests, runTests);

export default commands;
