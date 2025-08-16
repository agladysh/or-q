import { fail, readableToString, type Arguments, type Command, type IPluginRuntime } from '@or-q/lib';
import yaml from 'yaml';
import type { Readable } from 'node:stream';
import path from 'node:path';

type Dirs = { [dir: string]: Dirs | string | null };
type AnnotatedPathList = [string, string][];

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

const usage = 'usage: dirtree-annotated-json';

const command: Command = {
  description: 'consumes list of path - annotation pairs, returns hierarchy as JSON',
  usage,
  tags: ['utility'],
  run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
    input = await readableToString(input);
    // Lazy. Should validate schema.
    const list = yaml.parse(input) as AnnotatedPathList;
    if (!Array.isArray(list)) {
      console.error('Input:\n', input);
      return fail('dirtree-annotated-json: input is not an array');
    }
    const annotatedPaths = list.sort((lhs, rhs) => lhs[0].localeCompare(rhs[0]));
    const paths = [];
    const annotations = [];
    for (const [path, annotation] of annotatedPaths) {
      paths.push(path);
      annotations.push(annotation);
    }
    return JSON.stringify(paths2object(paths, annotations), null, 2);
  },
};

export default command;
