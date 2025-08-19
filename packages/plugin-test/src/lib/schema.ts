import { scope } from 'arktype';

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
    stdin: 'string',
    stdout: 'stream = ""',
    stderr: 'stream = ""',
    exit: 'number=0',
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
