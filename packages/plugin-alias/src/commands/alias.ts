import type { Arguments, IPluginRuntime } from '@or-q/lib';
import { commandArgument, fail, readableToString } from '@or-q/lib';
import { Readable } from 'node:stream';
import parseArgsStringToArgv from 'string-argv';
import pkg from '../../package.json' with { type: 'json' };

export const command = 'alias';
export const description = 'declares a command alias which may accept arguments via placeholders, forwards input';
export const usage = 'usage: alias "<name>" "<description>" [placeholders] [commands]';

export async function run(
  input: string | Readable,
  args: Arguments,
  runtime: IPluginRuntime
): Promise<string | Readable> {
  const name = (await commandArgument(runtime, args.shift(), usage)).trim();
  if (runtime.commandNameSet.has(name)) {
    return fail(`alias: command or alias "${name}" already exists`);
  }

  const description = await commandArgument(runtime, args.shift(), usage);

  // Lazy. DRY with similar cases to a lib function.
  let placeholdersRaw = args.shift();
  if (placeholdersRaw instanceof Readable) {
    placeholdersRaw = await readableToString(placeholdersRaw);
  }
  if (typeof placeholdersRaw === 'string') {
    placeholdersRaw = parseArgsStringToArgv(placeholdersRaw);
  }
  if (!Array.isArray(placeholdersRaw)) {
    return fail(`alias: placeholder is not string or array`);
  }
  for (const p of placeholdersRaw) {
    if (typeof p !== 'string') {
      return fail(`alias: unexpected placeholder ${JSON.stringify(p)}, should be a string value`);
    }
    if (runtime.commandNameSet.has(p)) {
      return fail(`alias: placeholder "${name}" is taken by existing command or alias, must be unique`);
    }
  }
  const placeholders: string[] = placeholdersRaw.map((p) => String(p).trim());

  // Lazy. DRY with similar cases to a lib function.
  let program = args.shift();
  if (program instanceof Readable) {
    program = await readableToString(program);
  }
  if (typeof program === 'string') {
    program = parseArgsStringToArgv(program);
  }
  if (!Array.isArray(program)) {
    return fail(`alias: arguments is not string or array`);
  }

  const aliasUsage = `usage: ${name} ${placeholders.join(' ')}`.trim();
  runtime.addCommand(pkg.name, name, {
    description: `${description.trim()} [alias]`,
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime) => {
      const placeholderValues: Record<string, string> = {};
      for (const p of placeholders) {
        placeholderValues[p] = await commandArgument(runtime, args.shift(), aliasUsage);
      }

      function patchPlaceholders(program: Arguments): Arguments {
        return program.map((arg) => {
          if (Array.isArray(arg)) {
            return patchPlaceholders(arg);
          }
          return placeholderValues[arg] ?? arg;
        });
      }

      return runtime.runCommands(input, patchPlaceholders(program));
    },
  });

  return input;
}
