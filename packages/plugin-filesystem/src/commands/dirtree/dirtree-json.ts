import { readableToString, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import yaml from 'yaml';
import type { Readable } from 'node:stream';
import path from 'node:path';

type Dirs = { [dir: string]: Dirs | string | null };

function paths2object(paths: string[], annotations?: string[]) {
  const root: Dirs = {};
  for (let i = 0; i < paths.length; ++i) {
    const filepath = paths[i];
    const parsed = path.parse(filepath);
    let base = root;
    if (parsed.dir !== '') {
      const dirs = parsed.dir.split(path.sep);
      for (let dir of dirs) {
        dir = dir + '/';
        if (!(dir in base)) {
          const subdir = {};
          base[dir] = subdir;
        }
        base = base[dir] as Dirs;
      }
    }
    base[parsed.base] = annotations && annotations[i] ? annotations[i] : null;
  }
  return root;
}

const usage = 'usage: dirtree-json';

const command: Command = {
  description: 'consumes list of paths, returns hierarchy as JSON',
  usage,
  tags: ['utility'],
  run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
    input = await readableToString(input);
    // Lazy. Should validate schema.
    const paths = yaml.parse(input).sort();
    return JSON.stringify(paths2object(paths), null, 2);
  },
};

export default command;
