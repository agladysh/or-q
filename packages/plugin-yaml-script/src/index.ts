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

function loadCommandsImpl(parent: Arguments, root: Arguments, commands: CommandList): Arguments | string {
  if (typeof commands === 'string' || Number.isFinite(commands)) {
    root.push(String(commands)); // Lazy. Push numbers as is, accept any number.
    return root;
  }

  if (Array.isArray(commands)) {
    // Lazy. Hack to workaround _DATA and _JSON creating empty arrays.
    // Refactor loading code to a proper idiomatic tree walking to handle optional child creation.
    if (commands.length === 0) {
      root.push(commands);
      return root;
    }
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
    const entries = Object.entries(commands);

    if (entries.length === 1 && entries[0][0] === '_DATA') {
      parent.push(JSON.stringify(entries[0][1]));
      return root;
    }

    if (entries.length === 1 && entries[0][0] === '_JSON') {
      root.push('echo'); // Lazy. This should create a dependency on or-q/plugin-echo, not on the whole core
      root.push(JSON.stringify(entries[0][1]));
      return root;
    }

    for (const [command, args] of entries) {
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

function loadYAMLScript(yamlString: string, runtime: IPluginRuntime) {
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

  const args = loadCommands(isArray ? data : data.commands);

  // Lazy. Should be a wrapper in the plugin lib.
  runtime.emit(loggingEventName, {
    source: pkg.name,
    level: logLevels.debug,
    value: ['loaded YAML script for commands', args],
  });

  return args;
}

async function runYAMLScript(
  input: string | Readable,
  yamlString: string,
  runtime: IPluginRuntime
): Promise<string | Readable> {
  const program = loadYAMLScript(yamlString, runtime);

  return runtime.runCommands(input, program);
}

// Lazy. Some commands are generic to any kind of scripting, e.g. on-empty-stdin. Move them to some other plugin.
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
    ['load-yaml-script-asset']: {
      description: 'loads YAML script from file and returns commands as JSON',
      run: async (_input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
        const uri = await commandArgument(runtime, args.shift(), 'usage: load-yaml-script "<file>"');

        const yamlString = resolveAssetSubdir(runtime, uri, 'scripts');
        if (yamlString === undefined) {
          return fail(`run: "${uri}" not found, did you mean "./${uri}?"`);
        }

        return `${JSON.stringify(loadYAMLScript(yamlString, runtime))}\n`;
      },
    },
    ['load-yaml-script-input']: {
      description: 'loads YAML script from input and returns commands as JSON',
      run: async (input: string | Readable, _args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
        input = await readableToString(input);

        return `${JSON.stringify(loadYAMLScript(input, runtime))}\n`;
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
    'on-empty-stdin': {
      description: 'if input is empty, runs commands to populate, treats TTY stdin as empty',
      run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
        // Not using commandArgument() helper, since we do NOT want sub-command expansion here.
        let arg = args.shift();
        if (arg === undefined) {
          return fail('usage: on-empty-stdin [actions]');
        }
        if (typeof arg === 'string') {
          arg = parseArgsStringToArgv(arg);
        }

        if (input === process.stdin && process.stdin.isTTY) {
          input = '';
        }

        input = await readableToString(input);

        if (input !== '') {
          return input;
        }

        return runtime.runCommands(input, arg.slice());
      },
    },
    // See also special handling in loader.
    _DATA: {
      description: 'not a command, reserved to use _DATA in yaml-scripts to create JSON arguments',
      run: async (
        _input: string | Readable,
        _args: Arguments,
        _runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        return fail('_DATA is not a command');
      },
    },
    // See also special handling in loader.
    _JSON: {
      description: 'not a command, reserved to use _JSON in yaml-scripts to create JSON inputs',
      run: async (
        _input: string | Readable,
        _args: Arguments,
        _runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        return fail('_DATA is not a command');
      },
    },
  },
};

export default plugin;
