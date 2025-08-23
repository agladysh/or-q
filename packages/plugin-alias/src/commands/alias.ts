import type { AtomMap, IProgram } from '@or-q/lib';
import { atomsContextID, fail, type LoggingEvent, loggingEventName, logLevels } from '@or-q/lib';
import type { Readable } from 'node:stream';
import pkg from '../../package.json' with { type: 'json' };

export const command = 'alias';
export const description = 'declares a command alias which may accept arguments via placeholders, forwards input';
export const usage = 'usage: alias "<name>" "<description>" [placeholders] [commands]';

export async function run(input: string | Readable, program: IProgram): Promise<string | Readable> {
  const name = (await program.ensureNext(usage).toString()).trim();
  if (program.runtime.commandNameSet.has(name)) {
    return fail(`alias: command or alias "${name}" already exists`);
  }

  const description = await program.ensureNext(usage).toString();
  const placeholders = (await program.ensureNext(usage).toFlatArray()).map((p) => {
    if (typeof p !== 'string') {
      return fail(`unexpected placeholder ${JSON.stringify(p)}, should be a string value`);
    }
    p = p.trim();
    if (program.runtime.commandNameSet.has(p)) {
      return fail(`placeholder "${name}" is taken by existing command or alias, must be unique`);
    }
    return p;
  });

  const aliasProgram = await program.ensureNext(usage).toProgram();

  const aliasUsage = `usage: ${name} ${placeholders.join(' ')}`.trim();

  program.runtime.emit<LoggingEvent>(loggingEventName, {
    source: pkg.name,
    level: logLevels.debug,
    value: ['alias', name, description],
  });

  program.runtime.addCommand(pkg.name, name, {
    description: `${description.trim()} [alias]`,
    run: async (input: string | Readable, program: IProgram) => {
      const map: AtomMap = {};
      for (const p of placeholders) {
        map[p] = await program.ensureNext(aliasUsage).toString();
      }

      return aliasProgram.runInContext(input, atomsContextID, map);
    },
  });

  return input;
}
