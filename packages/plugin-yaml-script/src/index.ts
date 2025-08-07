import {
  assetGlob,
  commandArgument,
  fail,
  loggingEventName,
  logLevels,
  readableToString,
  resolveAsset,
  type Arguments,
  type IPluginRuntime,
  type Plugin,
} from '@or-q/lib';
import { parse } from 'node:path';
import type { Readable } from 'node:stream';
import yaml from 'yaml';

import pkg from '../package.json' with { type: 'json' };
import parseArgsStringToArgv from 'string-argv';

type CommandList = unknown;

interface Script {
  requires: [string];
  ['on-empty-stdin']: CommandList;
  commands: CommandList;
}

function loadCommandsImpl(
  root: Arguments,
  commands: CommandList
): Arguments | string {
  if (typeof commands === 'string') {
    root.push(commands);
    return root;
  }

  if (Array.isArray(commands)) {
    // Nested call
    const child: Arguments = [];
    root.push(child);
    for (const command of commands) {
      loadCommandsImpl(child, command);
    }
    return root;
  }

  if (typeof commands === 'object' && commands !== null) {
    for (const [command, args] of Object.entries(commands)) {
      if (command === '_DATA') {
        root.push(JSON.stringify(args));
        continue;
      }

      root.push(String(command));
      if (Array.isArray(args)) {
        // Several arguments
        for (const command of args) {
          loadCommandsImpl(root, command);
        }
        continue;
      }
      loadCommandsImpl(root, args);
    }
    return root;
  }

  return fail(`unexpected command value type ${typeof commands}`);
}

function loadCommands(commands: CommandList): Arguments {
  if (!Array.isArray(commands)) {
    return fail(`unexpected command list value type ${typeof commands}`);
  }

  const result: Arguments = [];
  for (const command of commands) {
    loadCommandsImpl(result, command);
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

  if (data.requires?.length > 0) {
    for (const name of data.requires) {
      if (!runtime.plugins[name]) {
        return fail(
          `required dependency ${name} not installed, try installing this node package`
        );
      }
    }
  }
  if (data['on-empty-stdin']) {
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

  const args = loadCommands(data.commands);

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
  commands: {
    fail: {
      description: 'fails with an error message',
      run: async (
        _input: string | Readable,
        args: Arguments,
        runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        const text = await commandArgument(
          runtime,
          args.shift(),
          'usage: fail "<text>"'
        );
        return fail(text);
      },
    },
    exec: {
      description: 'executes YAML script from argument',
      run: async (
        input: string | Readable,
        args: Arguments,
        runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        const yamlString = await commandArgument(
          runtime,
          args.shift(),
          'usage: exec "<yaml>", you may use run <(cat filename.yaml) to read from file'
        );
        return runYAMLScript(input, yamlString, runtime);
      },
    },
    ['list-script-assets']: {
      description:
        'prints the list of available builtin scripts to stdout, passes input along',
      run: async (
        input: string | Readable,
        _args: Arguments,
        runtime: IPluginRuntime
      ): Promise<string | Readable> => {
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
      run: async (
        input: string | Readable,
        args: Arguments,
        runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        const uri = await commandArgument(
          runtime,
          args.shift(),
          'usage: run "<file>"'
        );

        let yamlString = resolveAsset(runtime, uri);
        if (yamlString === undefined) {
          // Unqualified URIs are loaded from plugins.
          // Use dot notation (./dir/filename.yaml) or an absolute path (/path/to/filename.yaml) to load from filesystem
          // Lazy. This will likely fail on Windows. Normalize plugin path separators on ingestion.
          const assetNames = assetGlob(
            runtime,
            `plugin:*/**/scripts/**/${uri}.yaml`
          ).sort();
          const assetName = assetNames[0]; // We handle not found below.
          yamlString = runtime.assets[assetName];
          if (assetNames.length > 1) {
            process.emitWarning(
              `run: several scripts found for "${uri}":\n* ${assetNames.join('\n* ')}\nUsing "${assetName}"`
            );
          }
        }

        if (yamlString === undefined) {
          return fail(`run: "${uri}" not found, did you mean "./${uri}?"`);
        }

        return runYAMLScript(input, yamlString, runtime);
      },
    },
    // Lazy. Replace with proper control flow commands
    forever: {
      description: 'runs forever, interrupt to exit',
      run: async (
        input: string | Readable,
        args: Arguments,
        runtime: IPluginRuntime
      ): Promise<string | Readable> => {
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
      run: async (
        _input: string | Readable,
        args: Arguments,
        _runtime: IPluginRuntime
      ): Promise<string | Readable> => {
        return JSON.stringify(args.splice(0, args.length));
      },
    },
  },
};

export default plugin;
