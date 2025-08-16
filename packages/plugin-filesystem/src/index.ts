import { type Plugin } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

// File commands
import catFile from './commands/file/cat-file.ts';
import file from './commands/file/file.ts';

// Dirtree commands
import dirtreeJson from './commands/dirtree/dirtree-json.ts';
import dirtreeAnnotatedJson from './commands/dirtree/dirtree-annotated-json.ts';
import dirtree from './commands/dirtree/dirtree.ts';

// Glob commands
import glob from './commands/glob/glob.ts';
import glob3 from './commands/glob/glob3.ts';

// Ignore command
import ignore from './commands/ignore.ts';

const plugin: Plugin = {
  name: pkg.name,
  description: pkg.description,
  commands: {
    'cat-file': catFile,
    file: file,
    'dirtree-json': dirtreeJson,
    'dirtree-annotated-json': dirtreeAnnotatedJson,
    dirtree: dirtree,
    glob: glob,
    glob3: glob3,
    ignore: ignore,
  },
};

export default plugin;
