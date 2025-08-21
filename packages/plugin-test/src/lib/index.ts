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
import { pipeline } from 'stream/promises';
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

/**
 * Loads and validates a test suite from YAML asset content.
 *
 * Parses YAML and applies arktype schema validation including:
 * - Timeout transformation from seconds to milliseconds
 * - Stream validator normalization (string -> {equals: string})
 * - Required field validation and default value application
 *
 * Throws TestSuiteLoadError with validation details if schema validation fails.
 * The error contains arktype's diagnostic information about what validation failed.
 */
export function loadTestSuiteAsset(asset: Asset): TestSuite {
  const data = yaml.parse(asset);
  const suite = testSuiteSchema(data);
  if (suite instanceof ArkErrors) {
    // Schema validation failed - provide arktype's detailed error information
    throw new TestSuiteLoadError(suite.summary); // Lazy. Improve diagnostics (e.g. most users would like to see uri in the error).
  }
  return suite;
}

/**
 * Result of spawning and executing a test command.
 *
 * stdout/stderr: Captured output from the process, converted to UTF-8 strings
 * code: Process exit code or the special "timeout" string when timeout occurs
 *
 * The timeout string distinguishes timeouts from normal exit codes, enabling
 * tests to explicitly expect timeout scenarios (e.g., testing `forever` command).
 */
interface SpawnTestResult {
  stdout: string;
  stderr: string;
  code: number | 'timeout';
}

// Lazy. DRY with lib's spawnText.
/**
 * Spawns a child process with timeout support for testing OR-Q commands.
 *
 * Architecture Overview:
 * - Uses local timeout flag for reliable timeout detection (avoids signal detection issues)
 * - Implements graceful termination with SIGTERM followed by SIGKILL escalation
 * - Collects stdout/stderr through data event handlers to capture output even during timeout
 * - Handles stdin feeding asynchronously to prevent blocking timeout logic
 * - Provides comprehensive resource cleanup in all exit scenarios
 *
 * Timeout Behavior:
 * - When timeout occurs, sets local flag before sending SIGTERM
 * - If process doesn't exit within 5 seconds, escalates to SIGKILL
 * - Returns "timeout" as exit code when timeout occurs
 * - Captures all output produced before termination
 *
 * Error Handling:
 * - Gracefully handles processes that ignore SIGTERM (via SIGKILL escalation)
 * - Handles processes that exit before stdin completion
 * - Cleans up timers and resources in all error scenarios
 * - Logs kill failures for debugging
 */
async function spawnTest(cmd: string, input: Readable | string, opts: SpawnOptions = {}): Promise<SpawnTestResult> {
  const { args = [], timeout } = opts;

  // Local flag for reliable timeout detection - only we can set this
  // This avoids false positives from external signals or race conditions
  let timedOut = false;

  // Track kill attempts to avoid redundant signals and implement escalation
  let killAttempts = 0;
  let sigTermTimer: NodeJS.Timeout | undefined;
  let sigKillTimer: NodeJS.Timeout | undefined;

  const child = spawn(cmd, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: false,
    env: { ...process.env, NODE_NO_WARNINGS: '1' }, // Reduce noise
  });

  // Collect output immediately to avoid race conditions with process termination
  // These handlers capture data even if the process is killed during timeout
  const stdout: Buffer[] = [];
  const stderr: Buffer[] = [];
  child.stdout!.on('data', (chunk) => stdout.push(chunk));
  child.stderr!.on('data', (chunk) => stderr.push(chunk));

  // Timeout implementation with SIGTERM -> SIGKILL escalation
  if (timeout) {
    sigTermTimer = setTimeout(() => {
      if (killAttempts === 0) {
        timedOut = true;
        killAttempts++;

        // Use nextTick to ensure flag is set before kill attempt
        // This guarantees consistent timeout detection
        process.nextTick(() => {
          try {
            child.kill('SIGTERM');

            // Escalate to SIGKILL after 5 seconds if process doesn't exit
            sigKillTimer = setTimeout(() => {
              if (killAttempts === 1) {
                killAttempts++;
                try {
                  child.kill('SIGKILL');
                } catch (error) {
                  // Process may have already exited - this is expected
                  console.error('SIGKILL failed (process likely already exited):', error);
                }
              }
            }, 5000);
          } catch (error) {
            // Most common: process already exited, permission denied
            // This is not necessarily an error - process may have completed normally
            console.error('SIGTERM failed:', error);
          }
        });
      }
    }, timeout);

    // Clean up timers when process exits naturally
    child.on('exit', () => {
      if (sigTermTimer) clearTimeout(sigTermTimer);
      if (sigKillTimer) clearTimeout(sigKillTimer);
    });
  }

  // Feed stdin asynchronously to prevent blocking timeout logic
  // Pipeline runs concurrently with timeout detection and output collection
  // If timeout occurs before stdin completion, the process will be killed
  const stdinSource = typeof input === 'string' ? Readable.from(input) : input;
  pipeline(stdinSource, child.stdin!).catch((error) => {
    // Pipeline failure is expected if process exits before stdin completion
    // This happens during timeouts or when commands exit early
    if (!timedOut && child.exitCode === null) {
      console.error('Stdin pipeline failed unexpectedly:', error);
    }
  });

  return new Promise<SpawnTestResult>((resolve, reject) => {
    child.on('close', (code) => {
      // Clean up any remaining timers
      if (sigTermTimer) clearTimeout(sigTermTimer);
      if (sigKillTimer) clearTimeout(sigKillTimer);

      // Output collection is synchronous since we use data event handlers
      // All data received before close event is guaranteed to be captured
      const result: SpawnTestResult = {
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8'),
        code: timedOut ? 'timeout' : (code ?? 0),
      };

      resolve(result);
    });

    child.on('error', (error) => {
      // Clean up timers on process error
      if (sigTermTimer) clearTimeout(sigTermTimer);
      if (sigKillTimer) clearTimeout(sigKillTimer);
      reject(error);
    });
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
    /**
     * Validates stream output (stdout/stderr) against expected patterns.
     *
     * Trims whitespace from actual output for consistent comparison since CLI output
     * often contains trailing newlines that are not significant for test validation.
     *
     * Supports three validation types:
     * - equals: exact string match after trimming
     * - contains: substring search within actual output
     * - matches: regex pattern matching against actual output
     *
     * Multiple validators can be applied to same stream - all must pass for test success.
     * Empty validator array means no validation (any output accepted).
     */
    function* validate(name: string, actual: string, rules: StreamValidators) {
      // Lazy. Provide non-trimming versions
      // Trim whitespace for consistent comparison with expected values
      // CLI commands often produce trailing newlines that aren't test-significant
      actual = actual.trim();

      // Lazy. Improve error diagnostics
      // Apply each validation rule independently - all must pass
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
      // Tests MUST spawn isolated or-q instances to ensure test independence and avoid shared state
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

/**
 * Public interface for running test suites - wraps the generator implementation.
 *
 * Converts the generator output to a Readable stream for integration with OR-Q's
 * pipeline architecture where commands must return string | Readable.
 *
 * The objectMode: false setting ensures the stream operates in string mode,
 * yielding the tab-separated test result format as text chunks.
 */
export async function runTestSuite(runtime: IPluginRuntime, suite: TestSuite): Promise<string | Readable> {
  return Readable.from(runTestSuiteImpl(runtime, suite), { objectMode: false });
}
