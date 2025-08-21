import {
  assetGlob,
  resolveAssetSubdir,
  type Asset,
  type AssetURI,
  type IPluginRuntime,
  type SpawnOptions,
} from '@or-q/lib';
import { ArkErrors } from 'arktype';
import { spawn } from 'child_process';
import { Readable } from 'node:stream';
import { pipeline, finished } from 'stream/promises';
import parseArgsStringToArgv from 'string-argv';
import yaml from 'yaml';
import { testSuiteSchema, type StreamValidators, type TestSuite } from './schema.ts';

export class TestSuiteLoadError extends Error {}

const subdir = 'tests';

export function listTestSuites(runtime: IPluginRuntime): AssetURI[] {
  return assetGlob(runtime, `plugin:*/**/${subdir}/**/*.yaml`);
}

export function resolveTestSuiteAsset(runtime: IPluginRuntime, uri: string): Asset | undefined {
  return resolveAssetSubdir(runtime, uri, subdir);
}

export function loadTestSuiteAsset(asset: Asset): TestSuite {
  const data = yaml.parse(asset);
  const suite = testSuiteSchema(data);
  if (suite instanceof ArkErrors) {
    throw new TestSuiteLoadError(suite.summary); // Lazy. Improve diagnostics (e.g. most users would like to see uri in the error).
  }
  return suite;
}

interface SpawnTestResult {
  stdout: string;
  stderr: string;
  code: number | 'timeout';
}

// Lazy. DRY with lib's spawnText.
async function spawnTest(cmd: string, input: Readable | string, opts: SpawnOptions = {}): Promise<SpawnTestResult> {
  const { args = [], timeout } = opts;

  let timedOut = false;

  const child = spawn(cmd, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: false,
    env: { ...process.env, NODE_NO_WARNINGS: '1' }, // Reduce noise
  });

  // Collect output - register handlers immediately to avoid race conditions
  const stdout: Buffer[] = [];
  const stderr: Buffer[] = [];
  child.stdout!.on('data', (c) => stdout.push(c));
  child.stderr!.on('data', (c) => stderr.push(c));

  if (timeout) {
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        // Give a brief moment for any pending output to be written
        process.nextTick(() => {
          child.kill('SIGTERM');
        });
      } catch {
        // Ignore kill errors (e.g., permission or already exited)
      }
    }, timeout);
    child.on('exit', () => clearTimeout(timer));
  }

  // Feed stdin after output handlers are registered
  await pipeline(typeof input === 'string' ? Readable.from(input) : input, child.stdin!);

  return new Promise<SpawnTestResult>((resolve, reject) => {
    child.on('close', async (code) => {
      try {
        // Ensure all output streams are fully read
        await Promise.all([finished(child.stdout!, { cleanup: false }), finished(child.stderr!, { cleanup: false })]);

        // Give a brief moment for any remaining buffered data to be processed
        await new Promise((resolve) => process.nextTick(resolve));

        resolve({
          stdout: Buffer.concat(stdout).toString('utf8'),
          stderr: Buffer.concat(stderr).toString('utf8'),
          code: timedOut ? 'timeout' : (code ?? 0),
        });
      } catch (error) {
        reject(error);
      }
    });

    child.on('error', reject);
  });
}

// Lazy. This should probably use node-tap.
async function* runTestSuiteImpl(runtime: IPluginRuntime, suite: TestSuite) {
  yield `SUITE\t${suite.suite}\n`;
  let errors = 0;
  for (const plugin of suite.requires) {
    if (!runtime.plugins[plugin]) {
      yield `\tFAIL\trequires\ttest dependency ${plugin} not installed\n`;
      ++errors;
    }
  }
  if (errors === 0) {
    let testErrors = 0;
    function* validate(name: string, actual: string, rules: StreamValidators) {
      // Lazy. Provide non-trimming versions
      actual = actual.trim();

      // Lazy. Improve error diagnostics
      for (const rule of rules) {
        if ('equals' in rule && actual !== rule.equals.trim()) {
          yield `\t\tFAIL\t${name}\tactual "${actual}" expected to equal "${rule.equals.trim()}"\n`;
          ++testErrors;
        }
        if ('contains' in rule && !actual.includes(rule.contains.trim())) {
          yield `\t\tFAIL\t${name}\tactual "${actual}" expected to contain "${rule.contains.trim()}"\n`;
          ++testErrors;
        }
        if ('matches' in rule && !new RegExp(rule.matches.trim()).test(actual)) {
          yield `\t\tFAIL\t${name}\tactual "${actual}" expected to match "${rule.matches.trim()}"\n`;
          ++testErrors;
        }
      }
    }

    for (const test of suite.tests) {
      testErrors = 0;
      yield `\tTEST\t${test.name}\n`;
      // Build argv from test spec and spawn CLI directly (no pnpm)
      const argv = Array.isArray(test.argv) ? test.argv : parseArgsStringToArgv(test.argv);
      const result = await spawnTest('or-q', test.stdin, { args: argv, timeout: test.timeout });

      if (result.code !== test.exit) {
        yield `\t\tFAIL\texit\t got ${result.code} expected ${test.exit}\n`;
        ++testErrors;
      }
      yield* validate('stdout', result.stdout, test.stdout);
      if (test.stderr) {
        yield* validate('stderr', result.stderr, test.stderr);
      }
      if (testErrors > 0) {
        ++errors;
        yield `\tFAILED\tTEST\t${test.name}\n`;
      } else {
        yield `\tPASSED\tTEST\t${test.name}\n`;
      }
    }
  }
  if (errors > 0) {
    yield `FAILED\tSUITE\t${suite.suite}\n`;
  } else {
    yield `PASSED\tSUITE\t${suite.suite}\n`;
  }
}

export async function runTestSuite(runtime: IPluginRuntime, suite: TestSuite): Promise<string | Readable> {
  return Readable.from(runTestSuiteImpl(runtime, suite), { objectMode: false });
}
