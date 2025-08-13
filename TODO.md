# TODO

- [ ] Implement initial task and decision tracking processes.
- [x] Support markdownlint in lint and fix modes.
- [ ] Add ollama connector for gpt-oss:20b
- [ ] Fill in (and update) nicely descriptions, keywords and other fields in all package.json files
- [ ] Move installed-node-modules to a standalone repo and publish (perhaps under a better name) it in npm.
- [ ] Implement proper schemas for command arguments
- [ ] Implement a sane schema for scripts
- [ ] bind fengari, add a Lua module codegen feature and command for commands of available plugins (for all and for
      specific plugin), add lua and exec-lua commands (run each command individually in Lua, so we get nice coroutines
      and branching)
- [ ] same as for Lua, but for JavaScript (with typings codegen for TS)
- [ ] Provide a `help` command
- [ ] Implement more OpenRouter endpoints
- [ ] Write a README.md file
- [ ] Cleanup `Lazy` comments.
- [ ] Implement declaratuve black-box tests: per plugin, `packages/**/tests/**/.yaml` (env, args, stdin, stdout,
      stderr), add a test-plugin and test-all-plugins commands
- [ ] Provide a `spawn` command to spawn arbitrary shell process
- [ ] Implement the bi-system.
- [ ] Support YAML string passing as input
- [ ] Support JSON-like data object passing as input to save on serialization / deserialization
- [ ] Emit operations on input pipeline? We are kinda doing this anyway, might make it official as well
- [ ] Cleanup plugin-openrouter-api/assets/scripts
- [ ] Move conversation commands to new @or-q/plugin-openai-chat and rename to openai-\*
- [ ] Rename openrouter-specific commands to openrouter-\*
