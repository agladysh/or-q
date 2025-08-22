import { type IPluginRuntime, readableToString } from '@or-q/lib';
import type { Readable } from 'stream';
import parseArgsStringToArgv from 'string-argv';

export const tmp = 42;
export type Handler = (raw: string) => Promise<string>;

export async function renderTemplate(src: string, h: Handler): Promise<string> {
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

export async function renderORQ(
  runtime: IPluginRuntime,
  template: string,
  input: string | Readable = ''
): Promise<string> {
  return renderTemplate(
    template,
    async (raw: string): Promise<string> =>
      readableToString(await runtime.runCommands(input, parseArgsStringToArgv(raw)))
  );
}
