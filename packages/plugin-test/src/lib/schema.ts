import { scope } from 'arktype';

/**
 * Test Suite Schema Definition
 *
 * This schema validates and transforms YAML test suite files into typed TypeScript objects.
 * It uses arktype for runtime validation and transformation with the following design:
 *
 * Stream Validation System:
 * - Tests can validate stdout/stderr using equals, contains, or matches rules
 * - literalValidator converts plain strings to {equals: string} format for convenience
 * - Multiple validators can be applied to the same stream output
 *
 * Timeout Handling:
 * - YAML files specify timeouts in human-readable seconds (e.g., timeout: 5)
 * - Schema automatically transforms to milliseconds for internal use (5 -> 5000)
 * - Default timeout is 30 seconds, applied before transformation (30 -> 30000ms)
 * - This provides safety net against hanging tests while allowing override for slow operations
 *
 * Exit Code Support:
 * - Normal numeric exit codes (0, 1, 2, etc.)
 * - Special "timeout" string for tests that expect to timeout
 * - Union type ensures type safety while supporting both scenarios
 *
 * Test Isolation:
 * - Each test spawns independent or-q process to avoid shared state
 * - Plugin dependencies listed in 'requires' are validated before test execution
 * - Tests fail fast if required plugins are not available
 */
const schema = scope({
  equals: {
    '+': 'reject',
    equals: 'string',
  },
  contains: {
    '+': 'reject',
    contains: 'string > 0',
  },
  matches: {
    '+': 'reject',
    matches: 'string > 0',
  },
  validator: 'equals|contains|matches',
  validators: 'validator[]',
  literalValidator: ['string', '=>', (s: string) => [{ equals: s }]],
  stream: 'literalValidator|validators',
  test: {
    name: 'string > 0',
    argv: 'string|string[]',
    stdin: 'string = ""',
    stdout: 'stream = ""',
    stderr: 'stream = ""',
    exit: 'number|"timeout"=0',
    // YAML specifies seconds; default to 30 and transform to milliseconds
    // Default (30) is applied first, then transformation (30 -> 30000ms)
    timeout: [['number > 0', '=>', (s: number) => s * 1000], '=', 30],
  },
  suite: {
    suite: 'string > 0',
    requires: ['(string > 0)[]', '=', () => []],
    tests: 'test[] > 0',
  },
}).export();

export const testSuiteSchema = schema.suite;

export type TestSuite = typeof testSuiteSchema.infer;
export type StreamValidators = typeof schema.validators.infer;
