# TODO

Keep sections in decreasing order of priority.

## First Priority

- [ ] Provide a `help` plugin and command

## Low Hanging Fruits

- [ ] Replace JSON.parse(JSON.stringify()) with modern structuredClone() calls.
- [ ] Forbid console.\* in eslint, emit logging events instead.
- [ ] Cleanup random files in plugin-openrouter-api/assets/scripts by moving them to `.or-q/asset/scripts`

## Testing

- [ ] Implement declaratuve black-box tests: per plugin, `packages/**/tests/**/.yaml` (env, args, stdin, stdout,
      stderr), add a test-plugin and test-all-plugins commands

## Development Documentation

- [ ] Identify and document implicit coding conventions
- [ ] Identify and document technical debt based on `Lazy` comments
- [ ] Cleanup `Lazy` comments. Implement low hanging fruits, move the rest to this file.

## User Documentation

- [ ] Write a README.md file

## Plugins

- [ ] Move conversation commands to new @or-q/plugin-openai-chat and rename to openai-\*
- [ ] Rename openrouter-specific commands to openrouter-\*
- [ ] Implement more OpenRouter endpoints

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
- [ ] Support JSON-like data object passing as input to save on serialization / deserialization
- [ ] CLI and YAML are external DSLs which are translated to the raw program form.
- [ ] Schemas for CLI and YAML are generated dynamically
- [ ] Fill in (and update) nicely descriptions, keywords and other fields in all package.json files

## Design Debt

- [ ] figure out how to handle fetch errors properly, jp without branching is not nice

## Technical Debt

- [ ] Implement exponential backoffs on 429 etc on all fetch() calls

## Product

- [ ] Implement driver as an MCP server in addition to cli
- [ ] Implement a visual no/low-code editor
- [ ] Implement repository description generation script
- [ ] Implement initial task and decision tracking processes.

## Dependency Management

- [ ] Move installed-node-modules to a standalone repo and publish (perhaps under a better name) it in npm.

## Backlog

- [ ] bind fengari, add a Lua module codegen feature and command for commands of available plugins (for all and for
      specific plugin), add lua and exec-lua commands (run each command individually in Lua, so we get nice coroutines
      and branching)
- [ ] same as for Lua, but for JavaScript (with typings codegen for TS)
- [ ] Implement the TRIZ bi-system with Bayesian Bandit of some sorts

## Unsorted

Priority of items in this section is unknown. Triage them to other directories.

- _(No standing items)_
