import {
  assetGlob,
  commandArgument,
  fail,
  loadModuleAssets,
  loggingEventName,
  logLevels,
  readableToString,
  resolveAssetSubdir,
  type Arguments,
  type IPluginRuntime,
  type Plugin,
} from '@or-q/lib';
import { parse } from 'node:path';
import type { Readable } from 'node:stream';
import yaml from 'yaml';

import parseArgsStringToArgv from 'string-argv';
import pkg from '../package.json' with { type: 'json' };

type CommandList = unknown;

interface Script {
  requires: [string];
  ['on-empty-stdin']: CommandList;
  commands: CommandList;
}

type JSONPrimitive = string | number | boolean;
type JSONArray = (JSONPrimitive | JSONRecord | JSONArray)[];
type JSONRecord = { [key: string]: JSONPrimitive | JSONArray | JSONRecord };
type JSONValue = JSONArray | JSONRecord | JSONPrimitive;

// Intentionally not handling any keys except _RAW as special
// Lazy. Seems obsurdly slow. Probably isn't for how it would be used, but is there a simpler solution?
function loadYAMLAsJSONCommand(stream: Arguments, obj: JSONValue): Arguments {
  if (typeof obj === 'string') {
    stream.push('string', String(obj));
    return stream;
  }

  if (typeof obj === 'boolean') {
    stream.push(obj ? 'true' : 'false');
    return stream;
  }

  if (!Number.isNaN(Number(obj))) {
    stream.push('number', String(obj));
    return stream;
  }

  if (Array.isArray(obj)) {
    stream.push('array');
    for (const item of obj) {
      loadYAMLAsJSONCommand(stream, item);
    }
    stream.push('end-array');
    return stream;
  }

  const entries = Object.entries(obj);

  if (entries.length === 1 && entries[0][0] === '_RAW') {
    stream.push(loadCommands(entries[0][1] as CommandList)); // Lazy. Check schema.
    return stream;
  }

  stream.push('object');
  for (const [key, value] of entries) {
    stream.push(key);
    loadYAMLAsJSONCommand(stream, value);
  }
  stream.push('end-object');

  return stream;
}

async function loadInputFromJSONCommand(runtime: IPluginRuntime, args: Arguments): Promise<JSONValue> {
  // Spammy even for spam, but useful for debugging.
  /*/
  // Lazy. Should be a wrapper in the plugin lib.
  runtime.emit(loggingEventName, {
    source: pkg.name,
    level: logLevels.spam,
    value: ['loading _JSON', args],
  });
  /**/

  type Handler = (args: Arguments) => Promise<JSONValue>;

  const handlers: Record<string, Handler> = {
    true: () => Promise.resolve(true),
    false: () => Promise.resolve(false),
    string: (args) => Promise.resolve(String(args.shift())),
    number: (args) => Promise.resolve(Number(args.shift())),
    array: async (args) => {
      const result: JSONArray = [];
      while (args[0] !== 'end-array') {
        result.push(await loadInputFromJSONCommand(runtime, args));
      }
      const end = args.shift();
      if (end !== 'end-array') {
        return fail(`invalid _JSON command data: unexpected end of array: ${end}`);
      }
      return result;
    },
    object: async (args) => {
      const result: JSONRecord = {};
      while (args[0] !== 'end-object') {
        const key = args.shift();
        if (typeof key !== 'string') {
          return fail(`invalid _JSON command object key type "${typeof key}"`); // Lazy. Improve error reporting.
        }
        result[key] = await loadInputFromJSONCommand(runtime, args);
      }
      const end = args.shift();
      if (end !== 'end-object') {
        return fail(`invalid _JSON command data: unexpected end of object: ${end}`);
      }
      return result;
    },
  } as const;

  const arg = args.shift();

  if (Array.isArray(arg)) {
    return await readableToString(await runtime.runCommands('', arg));
  }

  if (typeof arg !== 'string') {
    console.error('while loading _JSON', [arg, ...args]);
    return fail(`invalid _JSON command data type "${typeof arg}"`); // Lazy. Improve error reporting.
  }

  const handler = handlers[arg];
  if (!handler) {
    return fail(`invalid _JSON command data entry "${arg}"`); // Lazy. Improve error reporting.
  }

  return handler(args);
}

function loadCommandsImpl(parent: Arguments, root: Arguments, commands: CommandList): Arguments | string {
  if (typeof commands === 'string' || Number.isFinite(commands)) {
    root.push(String(commands)); // Lazy. Push numbers as is, accept any number.
    return root;
  }

  if (Array.isArray(commands)) {
    // Nested call
    const child: Arguments = [];
    for (const command of commands) {
      loadCommandsImpl(root, child, command);
    }
    if (child.length > 0) {
      root.push(child);
    }
    return root;
  }

  if (typeof commands === 'object' && commands !== null) {
    for (const [command, args] of Object.entries(commands)) {
      if (command === '_DATA') {
        // Lazy. Seems obsolete, consider retiring in favor of _INPUT
        parent.push(JSON.stringify(args));
        continue;
      }

      if (command === '_JSON') {
        root.push(command);
        loadYAMLAsJSONCommand(root, args);
        continue;
      }

      root.push(String(command));
      if (Array.isArray(args)) {
        // Several arguments
        for (const command of args) {
          loadCommandsImpl(parent, root, command);
        }
        continue;
      }
      loadCommandsImpl(parent, root, args);
    }
    return root;
  }

  console.error('ingested so far', root);
  return fail(`unexpected command value type ${typeof commands}`);
}

function loadCommands(commands: CommandList): Arguments {
  if (!Array.isArray(commands)) {
    return fail(`unexpected command list value type ${typeof commands}`);
  }

  const result: Arguments = [];
  for (const command of commands) {
    loadCommandsImpl(result, result, command);
  }

  return result;
}

async function runYAMLScript(
  input: string | Readable,
  yamlString: string,
  runtime: IPluginRuntime
): Promise<string | Readable> {
  // Lazy: Validate schema with arktype
  const data = yaml.parse(yamlString) as Script;

  // Lazy. Should be a wrapper in the plugin lib.
  runtime.emit(loggingEventName, {
    source: pkg.name,
    level: logLevels.spam,
    value: ['loading YAML data', data.commands],
  });

  const isArray = Array.isArray(data);

  if (!isArray && data.requires?.length > 0) {
    for (const name of data.requires) {
      if (!runtime.plugins[name]) {
        return fail(`required dependency ${name} not installed, try installing this node package`);
      }
    }
  }
  if (!isArray && data['on-empty-stdin']) {
    input = await readableToString(input);
    if (input === '') {
      const args = loadCommands(data['on-empty-stdin']);
      // Lazy. Should be a wrapper in the plugin lib.
      runtime.emit(loggingEventName, {
        source: pkg.name,
        level: logLevels.debug,
        value: ['loaded YAML script for on-empty-stdin', args],
      });
      input = await runtime.runCommands(input, args);
    }
  }

  const args = loadCommands(isArray ? data : data.commands);

  // Lazy. Should be a wrapper in the plugin lib.
  runtime.emit(loggingEventName, {
    source: pkg.name,
    level: logLevels.debug,
    value: ['loaded YAML script for commands', args],
  });

  return runtime.runCommands(input, args);
}

const plugin: Plugin = {
  name: pkg.name,
  assets: loadModuleAssets(import.meta.url),
  commands: {
    exec: {
      description: 'executes YAML script from argument',
      run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
        const yamlString = await commandArgument(
          runtime,
          args.shift(),
          'usage: exec "<yaml>", you may use run <(cat filename.yaml) to read from file'
        );
        return runYAMLScript(input, yamlString, runtime);
      },
    },
    ['list-script-assets']: {
      description: 'prints the list of available builtin scripts to stdout, passes input along',
      run: async (input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
        // Lazy. Sort by name, so duplicates are clearly visible.
        const assetNames = assetGlob(runtime, `**/scripts/**/*.yaml`).sort();
        process.stdout.write(
          `Available script assets:\n\n${assetNames.map((a) => `* ${parse(a).name}\t${a}`).join('\n')}\n\n`
        );
        return input;
      },
    },
    run: {
      description: 'runs YAML script file from file: or plugin:',
      run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
        const uri = await commandArgument(runtime, args.shift(), 'usage: run "<file>"');

        const yamlString = resolveAssetSubdir(runtime, uri, 'scripts');
        if (yamlString === undefined) {
          return fail(`run: "${uri}" not found, did you mean "./${uri}?"`);
        }

        return runYAMLScript(input, yamlString, runtime);
      },
    },
    // Lazy. Replace with proper control flow commands
    forever: {
      description: 'runs forever, interrupt to exit',
      run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
        // Not using commandArgument() helper, since we do NOT want sub-command expansion here.
        let arg = args.shift();
        if (arg === undefined) {
          return fail('usage: forever [actions]');
        }
        if (typeof arg === 'string') {
          arg = parseArgsStringToArgv(arg);
        }
        while (true) {
          input = await runtime.runCommands(input, arg.slice());
        }
      },
    },
    // See also special handling in loader.
    _DATA: {
      description: 'converts remaining program to JSON data in input',
      run: async (_input: string | Readable, args: Arguments, _runtime: IPluginRuntime): Promise<string | Readable> => {
        return JSON.stringify(args.splice(0, args.length));
      },
    },
    // See also special handling in loader.
    _JSON: {
      description: 'replaces input with special format argument serialized as JSON',
      run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
        return JSON.stringify(await loadInputFromJSONCommand(runtime, args));
      },
    },
  },
};

export default plugin;
