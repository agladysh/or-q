import type { Arguments, IPluginRuntime, Plugin } from '@or-q/lib';
import { commandArgument, loadModuleAssets, readableToString } from '@or-q/lib';
import type { Readable } from 'node:stream';
import pkg from '../package.json' with { type: 'json' };
import parseArgsStringToArgv from 'string-argv';

type Handler = (raw: string) => Promise<string>;

async function renderTemplate(src: string, h: Handler): Promise<string> {
  let out = '';
  let i = 0;
  const len = src.length;

  while (i < len) {
    const c = src[i];

    // 1. Escape handling
    if (c === '\\') {
      if (i + 1 === len) {
        out += '\\';
        break;
      } // trailing backslash
      out += src[i + 1]; // copy escaped char
      i += 2;
      continue;
    }

    // 2. Expression start
    if (c === '$' && i + 1 < len && src[i + 1] === '{') {
      let expr = '';
      let depth = 1;
      i += 2; // skip "$"

      while (i < len) {
        const ch = src[i];

        // 2a.  Escape inside expression
        if (ch === '\\') {
          if (i + 1 === len) throw new SyntaxError('Unbalanced template expression');
          expr += src[i + 1];
          i += 2;
          continue;
        }

        // 2b.  Braces
        if (ch === '{') depth++;
        else if (ch === '}') {
          if (--depth === 0) {
            i++;
            break;
          } // consume final '}'
        }

        expr += ch;
        i++;
      }

      if (depth !== 0) throw new SyntaxError('Unbalanced template expression');
      out += await h(expr);
      continue;
    }

    // 3.  Literal text
    out += c;
    i++;
  }

  return out;
}

async function renderORQ(runtime: IPluginRuntime, template: string, input: string | Readable = ''): Promise<string> {
  return renderTemplate(
    template,
    async (raw: string): Promise<string> =>
      readableToString(await runtime.runCommands(input, parseArgsStringToArgv(raw)))
  );
}

const plugin: Plugin = {
  name: pkg.name,
  assets: loadModuleAssets(import.meta.url),
  commands: {
    t: {
      description: 'replaces input with a template instantiated from @orq/store',
      run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
        const template = await commandArgument(runtime, args.shift(), 'usage: t "[template]"');

        return renderORQ(runtime, template);
      },
    },
    f: {
      description: 'replaces input with a template instantiated from @orq/store, feeding it input',
      run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
        const template = await commandArgument(runtime, args.shift(), 'usage: t "[template]"');

        input = await readableToString(input); // Reading it as string to preserve stream.

        return renderORQ(runtime, template, input);
      },
    },
    render: {
      description: 'treats input as a template and instantiates it from @orq/store',
      run: async (input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
        return renderORQ(runtime, await readableToString(input));
      },
    },
  },
};

export default plugin;
