import { readableToString, type Arguments, type Commands, type IPluginRuntime } from '@or-q/lib';
import yaml from 'yaml';
import type { Readable } from 'node:stream';
import path from 'node:path';
import treeify, { type TreeObject } from 'treeify';

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

type AnnotatedPathList = [string, string][];

const commands: Commands = {
  ['dirtree-json']: {
    description: 'consumes list of paths, returns hierarchy as JSON',
    run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
      input = await readableToString(input);
      // Lazy. Should validate schema.
      const paths = yaml.parse(input).sort();
      return JSON.stringify(paths2object(paths), null, 2);
    },
  },
  ['dirtree-annotated-json']: {
    description: 'consumes list of path - annotation pairs, returns hierarchy as JSON',
    run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
      input = await readableToString(input);
      // Lazy. Should validate schema.
      const annotatedPaths = (yaml.parse(input) as AnnotatedPathList).sort((lhs, rhs) => lhs[0].localeCompare(rhs[0]));
      const paths = [];
      const annotations = [];
      for (const [path, annotation] of annotatedPaths) {
        paths.push(path);
        annotations.push(annotation);
      }
      return JSON.stringify(paths2object(paths, annotations), null, 2);
    },
  },
  ['dirtree']: {
    description: 'consumes list of paths or dirtree-json output, returns hierarchy as text',
    run: async (input: string | Readable, _args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
      input = await readableToString(input);
      let dirtree = yaml.parse(input);
      // Lazy. Should validate schema.
      if (Array.isArray(dirtree)) {
        dirtree = paths2object(dirtree.sort());
      }
      return './\n' + treeify.asTree(dirtree as TreeObject, true, true);
    },
  },
};

export default commands;
