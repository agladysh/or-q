# TODO

Keep sections in decreasing order of priority.

## First Priority

- [ ] Implement P0001: Help System
- [ ] Find `Lazy` with `TODO` and migrate them here.
- [ ] Triage and redesign command naming, focusing on non-idiomatic commands like echo and tee, which currently violate
      principle of least surprise by not behaving as their idiomatic names imply
- [ ] Add and configure conventional commits linting

## Low Hanging Fruits

- [ ] Add `true` command (replaces input with string `true`) in core/controlflow. Note we are intentionally not adding
      `false` command, as controlflow design is based on single string "token", `true`. Use this command in tests
      instead of `echo true`.
- [ ] Replace JSON.parse(JSON.stringify()) with modern structuredClone() calls.
- [ ] Forbid console.\* in eslint, emit logging events instead.
- [ ] Split @or-q/lib/index.ts to files
- [ ] Cleanup random files in plugin-openrouter-api/assets/scripts by moving them to `.or-q/asset/scripts`
- [ ] Whenever JSON is put to input: do not pretty-print it, but append a trailing newline
- [ ] Trim asset string arguments in all commands that ingest asset names from input
- [x] Design and execute removal of `on-empty-stdin` yaml-script clause in favor of `on-empty-stdin` command.

## Testing

- [x] Implement declaratuve black-box tests: per plugin, `packages/**/tests/**/.yaml` (argv, stdin, stdout, stderr)
- [ ] Design and add a test that verifies that all commands are covered with tests
- [ ] Design and add a test that verifies that all asset scripts are covered with tests
- [ ] Support configuring test process environment (test.env in suite, should _add_ to process.env of the runner)
- [ ] Add a test-plugin script
- [ ] Switch tests to TAP output, use some reporter for pnpm test
- [ ] Add pre-push hook that checks that all tests pass

## Development Documentation

- [ ] Identify and document implicit coding conventions
- [ ] Identify and document technical debt based on `Lazy` comments
- [ ] Cleanup `Lazy` comments. Implement low hanging fruits, move the rest to this file.

## User Documentation

- [ ] Write a README.md file

## Plugins

- [ ] Move conversation commands to new @or-q/plugin-openai-chat and rename to openai-\*
- [ ] Triage commands printing directly to stdout. Replace them with input-generating ones or remove altogether.
- [ ] Rename openrouter-specific commands to openrouter-\* or retire the plugin in favor of fetch scripts
- [ ] Implement all OpenRouter endpoints or retire the plugin in favor of fetch scripts
- [ ] Implement all Ollama endpoints or retire the plugin in favor of fetch scripts
- [ ] Find a good generic observability solution, and plug it in a-la logging, e.g. for fetch etc.

## Core

- [ ] Move fail() to IPluginRuntime interface as abort(), add fail logging level, add cli logger plugin which logs to
      stderr (error and fail only) and stdout (other events) replace stdio logger with file logger, which does not log
      at all unless provided with a filename via command
- [ ] Add loglevel event and core command, let logging plugins deviate (until next loglevel command)
- [ ] Do not rethrow on command failures, instead, log JS stacktrace nicely to fail.

## Architectural Debt

- [ ] Design and implement proper CS-rigorous raw program form, for nestable command/argument chains (which are
      essentially a weird form of dags or something). First class arguments, invocation form is always the (command,
      arguments) tuple explicitly (in data), and (command, arguments, input) implicitly (at runtime). Support raw form
      as js arrays. Arguments are schema-typed with arktype.
- [ ] Allow storing metadata information in the tuple (like source code location for nice errors)
- [ ] Support JSON-like data object passing as input to save on serialization / deserialization
- [ ] CLI and YAML are external DSLs which are translated to the raw program form.
- [ ] Schemas for CLI and YAML are generated dynamically
- [ ] Fill in (and update) nicely descriptions, keywords and other fields in all package.json files

## Design Debt

- [ ] figure out how to handle fetch errors properly, jp without branching is not nice

## Technical Debt

- [ ] Implement exponential backoffs on 429 etc on all fetch() calls
- [ ] Unify plugin structure so that commands are in separate files (ref.: core plugin)

## Product

- [ ] Implement driver as an MCP server in addition to cli
- [ ] Implement a visual no/low-code editor
- [ ] Implement repository description generation script
- [ ] Implement initial task and decision tracking processes.
- [ ] Modified (gamma=2, configurable) PERT 3-point estimator prompt-complex could be useful (more in fleshing out O/R/P
      scenarios than in numbers, since AI would human hours which are meaningless for AI agent coding, OTOH we may
      analytically treat numbers in hours a-la abstract complexity points, which could be useful)

## Dependency Management

- [ ] Move installed-node-modules to a standalone repo and publish (perhaps under a better name) it in npm.

## Backlog

- [ ] bind fengari, add a Lua module codegen feature and command for commands of available plugins (for all and for
      specific plugin), add lua and exec-lua commands (run each command individually in Lua, so we get nice coroutines
      and branching)
- [ ] same as for Lua, but for JavaScript (with typings codegen for TS)
- [ ] Same for s-expression syntax e.g. with <https://www.npmjs.com/package/s-expression>
- [ ] Implement the TRIZ bi-system with Bayesian Bandit of some sorts

## Unsorted

Priority of items in this section is unknown. Triage them to other directories.

- _(No standing items)_
