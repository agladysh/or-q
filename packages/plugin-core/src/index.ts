import { type Plugin, type Commands } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

// Assets commands
import cat from './commands/assets/cat.ts';

// Debug commands
import dump from './commands/debug/dump.ts';

// Error commands
import fail from './commands/fail.ts';

// Format commands
import tsv from './commands/formats/tsv.ts';

// Functional commands
import head from './commands/functional/head.ts';
import map from './commands/functional/map.ts';
import mapN from './commands/functional/map-n.ts';
import parallelMapN from './commands/functional/parallel-map-n.ts';

// Input commands
import prepend from './commands/input/prepend.ts';
import append from './commands/input/append.ts';

// IO commands
import dash from './commands/io/dash.ts';
import print from './commands/io/print.ts';
import tee from './commands/io/tee.ts';
import input from './commands/io/input.ts';
import echo from './commands/io/echo.ts';
import defaultCmd from './commands/io/default.ts';
import clear from './commands/io/clear.ts';
import readline from './commands/io/readline.ts';

// Log commands
import spam from './commands/log/spam.ts';
import debug from './commands/log/debug.ts';
import info from './commands/log/info.ts';
import log from './commands/log/log.ts';
import warn from './commands/log/warn.ts';
import error from './commands/log/error.ts';
import none from './commands/log/none.ts';

// Plugin commands (removed legacy commands)

// String commands
import unquote from './commands/string/unquote.ts';
import quote from './commands/string/quote.ts';
import replace from './commands/string/replace.ts';
import trim from './commands/string/trim.ts';
import trimStart from './commands/string/trimStart.ts';
import trimEnd from './commands/string/trimEnd.ts';

const commands: Commands = {
  // Assets
  cat,

  // Debug
  dump,

  // Error
  fail,

  // Formats
  tsv,

  // Functional
  head,
  map,
  'map-n': mapN,
  'parallel-map-n': parallelMapN,

  // Input
  prepend,
  append,

  // IO
  '-': dash,
  print,
  tee,
  input,
  echo,
  default: defaultCmd,
  clear,
  readline,

  // Log
  spam,
  debug,
  info,
  log,
  warn,
  error,
  none,

  // Plugins (legacy commands removed)

  // String
  unquote,
  quote,
  replace,
  trim,
  trimStart,
  trimEnd,
};

const plugin: Plugin = {
  name: pkg.name,
  description: pkg.description,
  commands,
};

export default plugin;
