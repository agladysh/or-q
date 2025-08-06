import {
  assetGlob,
  fail,
  readableToString,
  resolveAsset,
  type IPluginRuntime,
  type Plugin,
} from '@or-q/lib';
import { basename } from 'node:path';
import type { Readable } from 'node:stream';
import yaml from 'yaml';
import pkg from '../package.json' with { type: 'json' };

const plugin: Plugin = {
  name: pkg.name,
  commands: {
    ['-']: {
      description: 'read data from stdin, ignoring input',
      run: async (
        _input: string | Readable,
        _args: string[]
      ): Promise<string | Readable> => {
        return process.stdin;
      },
    },
    log: {
      description: 'logs trimmed argument to stdout, passing input forward',
      run: async (
        input: string | Readable,
        args: string[]
      ): Promise<string | Readable> => {
        const text = args.shift();
        // Lazy, this should be enforced by caller, including usage.
        if (text === undefined) {
          fail('usage: log "<text>"');
        }
        process.stdout.write(`${text.trim()}\n`);
        return input;
      },
    },
    tee: {
      description:
        'outputs end-trimmed input to stdout, passes it along untrimmed',
      run: async (
        input: string | Readable,
        _args: string[]
      ): Promise<string | Readable> => {
        input = await readableToString(input);
        process.stdout.write(`${input.trimEnd()}\n`);
        return input;
      },
    },
    tsv: {
      description: 'converts input JSON or YAML array of arrays to TSV',
      run: async (
        input: string | Readable,
        _args: string[]
      ): Promise<string | Readable> => {
        // Lazy. Very fragile. Use a real library.
        input = await readableToString(input);
        const data = yaml.parse(input) as Array<string>[][];
        return data.map((row) => `${row.join('\t')}`).join('\n');
      },
    },
    prepend: {
      description:
        'prepends argument to input, does NOT insert a newline at either end of argument',
      run: async (
        input: string | Readable,
        args: string[]
      ): Promise<string | Readable> => {
        const text = args.shift();
        // Lazy, this should be enforced by caller, including usage.
        if (text === undefined) {
          fail('usage: prepend "<text>\\n"');
        }
        input = await readableToString(input);
        return `${text}${input}`;
      },
    },
    append: {
      description:
        'appends argument to input, does NOT insert a newline at either end of argument',
      run: async (
        input: string | Readable,
        args: string[]
      ): Promise<string | Readable> => {
        const text = args.shift();
        // Lazy, this should be enforced by caller, including usage.
        if (text === undefined) {
          fail('usage: append "\\n<text>\\n"');
        }
        input = await readableToString(input);
        return `${input}${text}`;
      },
    },
    echo: {
      description: 'replaces input with argument',
      run: async (
        _input: string | Readable,
        args: string[]
      ): Promise<string | Readable> => {
        const text = args.shift();
        // Lazy, this should be enforced by caller, including usage.
        if (text === undefined) {
          fail('usage: echo "<text>"');
        }
        return text;
      },
    },
    ['list-assets']: {
      description:
        'prints the list of available assets to stdout, passes input along',
      run: async (
        input: string | Readable,
        _args: string[],
        runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        // Lazy. Sort by name, so duplicates are clearly visible.
        process.stdout.write(
          `Available assets:\n\n${runtime.assetNames.map((a) => `* ${basename(a)}\t${a}`).join('\n')}\n\n`
        );
        return input;
      },
    },
    cat: {
      description: 'replaces input with file or asset',
      run: async (
        _input: string | Readable,
        args: string[],
        runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        // Lazy. This is copy-pasted in several places with minor changes. Generalize.
        const uri = args.shift();
        // Lazy, this should be enforced by caller, including usage.
        if (uri === undefined) {
          // Lazy. Document uri schemas and resolution logic better
          return fail('usage: cat "<file>"');
        }

        let text = resolveAsset(runtime, uri);
        if (text === undefined) {
          // Unqualified URIs are loaded from plugins.
          // Use dot notation (./dir/filename.yaml) or an absolute path (/path/to/filename.yaml) to load from filesystem
          // Lazy. This will likely fail on Windows. Normalize plugin path separators on ingestion.
          const assetNames = assetGlob(runtime, `plugin:*/**/${uri}`).sort();
          const assetName = assetNames[0]; // We handle not found below.
          text = runtime.assets[assetName];
          if (assetNames.length > 1) {
            process.emitWarning(
              `cat: several assets found for "${uri}":\n* ${assetNames.join('\n* ')}\nUsing "${assetName}"`
            );
          }
        }

        if (text === undefined) {
          return fail(`cat: "${uri}" not found, did you mean "./${uri}?`);
        }

        return text;
      },
    },
  },
};

export default plugin;
