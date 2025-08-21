# P0001: Help System Implementation Roadmap

**Status**: DRAFT  
**Generated**: 2025-08-19  
**Parent Proposal**: [P0001-help-system.md](./P0001-help-system.md)

## Overview

This roadmap provides detailed action items for implementing the P0001 Help System proposal. The implementation is
broken into 10 phases, each designed to maintain system stability while progressively adding help system capabilities.

## Current State Analysis

### Plugins (15 total)

- @or-q/plugin-yaml-script
- @or-q/plugin-test ✅ (already follows target layout)
- @or-q/plugin-template
- @or-q/plugin-store
- @or-q/plugin-stdio-logger
- @or-q/plugin-shell
- @or-q/plugin-openrouter-api (partially organized)
- @or-q/plugin-ollama (partially organized)
- @or-q/plugin-macro
- @or-q/plugin-jp
- @or-q/plugin-format
- @or-q/plugin-filesystem (partially organized)
- @or-q/plugin-fetch
- @or-q/plugin-dot-or-q-assets (assets only)
- @or-q/plugin-core ✅ (well organized)

### Commands

Commands mapped across 15 plugins in 24 source files. See [Command Mapping](#command-mapping) below.

### Script Assets

- @or-q/plugin-dot-or-q-assets: 1 script
- @or-q/plugin-fetch: 2 scripts
- @or-q/plugin-ollama: 4 scripts
- @or-q/plugin-openrouter-api: 10 scripts
- @or-q/plugin-test: 2 scripts

## Phase 1: Prepare Detailed Implementation Roadmap ✅

**Status**: COMPLETED

**Actions Completed**:

- ✅ Read plugin-test source code layout
- ✅ Captured full list of plugins (15 plugins)
- ✅ Captured full list of commands
- ✅ Captured full list of script assets
- ✅ Located source files for each command
- ✅ Written detailed roadmap

## Phase 2: Implement Smoke Tests for Every Command

**Objective**: Ensure all existing commands have basic tests before making changes

**Actions Required**:

### 2.1 Update Plugin Package Files

- **@or-q/plugin-fetch**: Verify `assets` export exists
- **@or-q/plugin-ollama**: Verify `assets` export exists
- **@or-q/plugin-openrouter-api**: Verify `assets` export exists

**Note**: @or-q/plugin-dot-or-q-assets uses dynamic asset loading from `.or-q/assets/` directory and does not need an
assets export.

### 2.2 Create Smoke Tests

Create basic smoke test for each command following the established pattern in `@or-q/plugin-test`.

#### Test Infrastructure

**Location**: `packages/*/assets/tests/commands/*.yaml`  
**Pattern**: One YAML file per command  
**Example**: `packages/plugin-test/assets/tests/commands/discover-tests.yaml`

#### Test File Structure

```yaml
suite: command-name

requires: # Optional: list plugin dependencies
  - '@or-q/plugin-dependency'

tests:
  - name: smoke
    argv: command-name arg1 arg2  # Simple command line string
    # OR for flat arrays:
    argv: ["command", "arg1", "arg2"]  # Flat array format
    # OR for complex nested commands, use exec with YAML array:
    argv: exec "[['command', ['nested', 'args']]]"
    stdin: 'input data'
    stdout: 'exact-output'  # String literal for exact match
    # OR use validators:
    stdout:
      - contains: 'substring'
      - matches: 'regex-pattern'
      - equals: 'exact-match'
    stderr: 'error-output'  # Optional
    exit: 0  # Optional: expected exit code
```

#### Environment Assumptions

**Verified Available**:

- `.env` file with `OPENROUTER_API_KEY` (confirmed present)
- Ollama service running on `localhost:11434` (assumed per project setup)

#### Command Categories and Test Strategies

##### 1. Simple I/O Commands (75+ commands)

```yaml
# Example: echo command (exact output)
tests:
  - name: smoke
    argv: echo "test message"
    stdout: 'test message'

# Example: trim command (exact output)
tests:
  - name: smoke
    argv: trim
    stdin: '  padded text  '
    stdout: 'padded text'

# Example: quote command (exact JSON string)
tests:
  - name: smoke
    argv: quote
    stdin: 'hello world'
    stdout: '"hello world"'

# Example: pretty command (formatted JSON - use contains for formatting)
tests:
  - name: smoke
    argv: pretty
    stdin: '{"a":1,"b":2}'
    stdout:
      - contains: '{\n'
      - contains: '"a": 1'

# Example: jp command (exact JSONPath result)
tests:
  - name: smoke
    argv: jp name
    stdin: '{"name": "test", "id": 123}'
    stdout: '"test"'
```

##### 2. API/Service Commands (10 commands)

```yaml
# Example: completions (uses existing .env)
tests:
  - name: smoke
    argv: completions
    stdin: '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "test"}]}'
    stdout:
      - contains: '"choices"'  # OpenAI API response format
      - contains: '"message"'

# Example: ollama-generate (assumes Ollama running)
tests:
  - name: smoke
    argv: ollama-generate
    stdin: 'simple test prompt'
    stdout:
      - contains: '"response"'  # Ollama API response format

# Example: models (OpenRouter models list)
tests:
  - name: smoke
    argv: models
    stdout:
      - contains: '"data"'
      - contains: '"id"'
```

##### 3. Interactive Commands (2 commands)

```yaml
# Example: readline (mock stdin)
tests:
  - name: smoke
    argv: readline "Enter text: "
    stdin: 'test input\n'
    stdout:
      - contains: 'test input'

# Example: forever (use timeout - note: complex args need shell escaping)
tests:
  - name: smoke
    argv: forever "print test"
    timeout: 1000
    expect: timeout
```

##### 4. Mini-DSL Commands (2 commands)

**`_DATA` Command** - Converts remaining arguments to JSON array:

```yaml
suite: _DATA

tests:
  - name: smoke-single
    argv: _DATA "hello"
    stdout: '["hello"]'

  - name: smoke-multiple
    argv: _DATA "one" "two" "three"
    stdout: '["one","two","three"]'

  - name: smoke-empty
    argv: _DATA
    stdout: '[]'
```

**`_JSON` Command** - Mini-DSL for JSON construction:

```yaml
suite: _JSON

tests:
  - name: smoke-primitives
    argv: _JSON true
    stdout: 'true'

  - name: smoke-string
    argv: _JSON string hello
    stdout: '"hello"'

  - name: smoke-number
    argv: _JSON number 42
    stdout: '42'

  - name: smoke-array
    argv: _JSON array string one string two end-array
    stdout: '["one","two"]'

  - name: smoke-object
    argv: _JSON object key string value end-object
    stdout: '{"key":"value"}'

  - name: smoke-command-execution
    argv: exec "commands: [['_JSON', ['echo', 'test']]]"
    stdout: '"test"'
```

##### 5. Complex Functional Commands (6 commands)

```yaml
# Example: head command (exact JSON output)
tests:
  - name: smoke
    argv: head 2
    stdin: '["a", "b", "c", "d"]'
    stdout:
      - contains: '"a"'
      - contains: '"b"'
      - matches: '^\[\s*"a"\s*,\s*"b"\s*\]'

# Example: sort command (exact sorted array)
tests:
  - name: smoke
    argv: sort
    stdin: '["c", "a", "b"]'
    stdout:
      - contains: '"a","b","c"'

# Example: macro system (define macro and verify it's registered)
tests:
  - name: smoke-defmacro
    argv: exec "[['$defmacro', 'testmacro', ['echo', 'works']], ['dump-macros']]"
    stdin: 'input'
    stdout:
      - contains: '"testmacro"'  # Macro should be registered
      - contains: '"echo"'       # Macro definition should contain echo command
```

#### Implementation Notes

1. **All 86 Commands Are Testable**: No commands need to be skipped
2. **Meaningful Assertions**: Test actual expected outputs, not just "doesn't crash"
3. **Use Realistic Inputs**: Based on actual usage patterns in existing scripts
4. **Environment Dependencies**: Leverage existing `.env` and Ollama setup
5. **Error Cases Welcome**: Some tests may expect failures (missing env vars, etc.)
6. **Assertion Strategies**:
   - **Exact match**: Use string literals (`stdout: 'expected'`) for deterministic output
   - **Substring**: Use `contains` for partial matches in complex output
   - **Regex**: Use `matches` for pattern matching
   - **API responses**: Use `contains` to verify JSON structure elements
   - **Error cases**: Test `stderr` and `exit` codes for failure scenarios

#### Test Execution Pattern

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm or-q run-test-suite plugin-name
```

### 2.3 Test-Fix-Commit Cycle

**Per Plugin**: For each of the 15 plugins, create tests → run tests → fix issues → commit

### 2.4 Verification

- Run `pnpm test` and ensure all tests pass
- Final commit if needed

## Phase 3: Add Mandatory Plugin.description Field

**Objective**: Enable plugin-level help by adding description metadata

**Actions Required**:

### 3.1 Update Core Interface

**File**: `packages/lib/src/index.ts`

- Add mandatory `description: string` field to `Plugin` interface
- Update all type definitions that depend on Plugin interface

### 3.2 Update All Plugin Definitions

Update `src/index.ts` for each plugin to add `description: pkg.description`.

**Process**: Update each plugin individually with test-fix-commit cycle:

1. Update plugin `src/index.ts` file
2. Run `pnpm run lint:tsc` (verify TypeScript)
3. Run `pnpm run fix` (auto-fix any issues)
4. Run `pnpm test` (verify functionality)
5. Commit changes

#### Simple Updates (single index.ts file)

**Per Plugin Cycle**:

- **@or-q/plugin-yaml-script**: Update → Test → Fix → Commit
- **@or-q/plugin-template**: Update → Test → Fix → Commit
- **@or-q/plugin-store**: Update → Test → Fix → Commit
- **@or-q/plugin-stdio-logger**: Update → Test → Fix → Commit
- **@or-q/plugin-shell**: Update → Test → Fix → Commit
- **@or-q/plugin-macro**: Update → Test → Fix → Commit
- **@or-q/plugin-jp**: Update → Test → Fix → Commit
- **@or-q/plugin-format**: Update → Test → Fix → Commit
- **@or-q/plugin-fetch**: Update → Test → Fix → Commit
- **@or-q/plugin-dot-or-q-assets**: Update → Test → Fix → Commit

#### Already Correct

- **@or-q/plugin-test**: Already follows target pattern
- **@or-q/plugin-core**: No description export needed (different pattern)

#### Complex Updates (multiple source files)

**Per Plugin Cycle**:

- **@or-q/plugin-openrouter-api**: Update → Test → Fix → Commit
- **@or-q/plugin-ollama**: Update → Test → Fix → Commit
- **@or-q/plugin-filesystem**: Update → Test → Fix → Commit

**Example Change**:

```typescript
// Before
const plugin: Plugin = {
  name: pkg.name,
  commands: commands,
};

// After
const plugin: Plugin = {
  name: pkg.name,
  description: pkg.description,
  commands: commands,
};
```

### 3.3 Verification

- Run `pnpm run lint` to ensure all TypeScript errors are resolved
- Run `pnpm test` to ensure functionality is preserved
- Commit changes

## Phase 4: Add Optional Command Tags and Usage Fields

**Objective**: Prepare command metadata structure for help system

**Actions Required**:

### 4.1 Update Core Interface

**File**: `packages/lib/src/index.ts`

- Add optional `tags?: string[]` field to `Command` interface
- Add optional `usage?: string` field to `Command` interface

### 4.2 No Command Changes Required

Since fields are optional, no immediate command updates needed.

### 4.3 Verification

- Run `pnpm run lint` to ensure TypeScript compatibility
- Run `pnpm test` to ensure functionality is preserved
- Commit changes

## Phase 5: Make Command.usage Field Mandatory

**Objective**: Enforce usage documentation on all commands

**Actions Required**:

### 5.1 Update Core Interface

**File**: `packages/lib/src/index.ts`

- Change `usage?: string` to `usage: string` in `Command` interface

### 5.2 This Will Cause TypeScript Errors

All command definitions will need `usage` field before this compiles.

## Phase 6: Systematically Refactor Each Plugin to Target Layout

**Objective**: Restructure all plugins to follow plugin-test pattern with individual command files

**Target Layout Pattern** (from plugin-test):

```text
src/
├── index.ts          # Plugin definition only
├── commands/
│   ├── index.ts      # Command aggregation using commandsFromImports
│   ├── command1.ts   # Individual command file
│   └── command2.ts   # Individual command file
└── lib/              # Shared utilities (if needed)
```

**Individual Command File Pattern**:

```typescript
export const command = 'command-name';
export const description = 'command description';
export const usage = 'usage: command-name [args]';
export const tags = ['tag1', 'tag2']; // optional

export async function run(
  input: string | Readable,
  args: Arguments,
  runtime: IPluginRuntime
): Promise<string | Readable> {
  // implementation
}
```

### 6.1 Plugin Refactoring Order

#### Already Compliant

- **@or-q/plugin-test**: ✅ No changes needed

#### Simple Refactoring (single source file)

1. **@or-q/plugin-yaml-script** (6 commands)
2. **@or-q/plugin-template** (3 commands)
3. **@or-q/plugin-store** (5 commands)
4. **@or-q/plugin-stdio-logger** (1 command)
5. **@or-q/plugin-shell** (1 command)
6. **@or-q/plugin-macro** (4 commands)
7. **@or-q/plugin-jp** (1 command)
8. **@or-q/plugin-format** (3 commands)
9. **@or-q/plugin-fetch** (1 command)

#### Complex Refactoring (multiple source files)

1. **@or-q/plugin-filesystem** (8 commands in 4 files)
2. **@or-q/plugin-openrouter-api** (6 commands in 3 files)
3. **@or-q/plugin-ollama** (3 commands in 2 files)
4. **@or-q/plugin-core** (28 commands in 9 files)

### 6.2 Detailed Refactoring Actions

#### @or-q/plugin-yaml-script

**Commands**: exec, list-script-assets, run, forever, \_DATA, \_JSON

**Current Structure**: Single `src/index.ts` file **Actions**:

1. Create `src/commands/index.ts` using `commandsFromImports`
2. Extract each command to individual file:
   - `src/commands/exec.ts`
   - `src/commands/list-script-assets.ts`
   - `src/commands/run.ts`
   - `src/commands/forever.ts`
   - `src/commands/_DATA.ts`
   - `src/commands/_JSON.ts`
3. Add `usage` field and appropriate `tags` to each command
4. Update main `src/index.ts` to import from commands
5. **Test-Fix-Commit**: Run full cycle (lint → fix → test → commit) before next plugin

**Tags Strategy**:

- `yaml-script` for all commands
- `list-script-assets`: add `help-command` tag

#### @or-q/plugin-template

**Commands**: t, f, render

**Current Structure**: Single `src/index.ts` file **Actions**:

1. Create `src/commands/index.ts`
2. Extract commands:
   - `src/commands/t.ts`
   - `src/commands/f.ts`
   - `src/commands/render.ts`
3. Add usage and tags: `template`
4. **Test-Fix-Commit**: Run full cycle (lint → fix → test → commit) before next plugin

#### @or-q/plugin-store

**Commands**: load, save, set, setdata, dump-store

**Current Structure**: Single `src/index.ts` file **Actions**:

1. Create `src/commands/index.ts`
2. Extract commands:
   - `src/commands/load.ts`
   - `src/commands/save.ts`
   - `src/commands/set.ts`
   - `src/commands/setdata.ts`
   - `src/commands/dump-store.ts`
3. Add usage and tags: `store`
4. Add `discovery-command` tag to `dump-store`
5. **Test-Fix-Commit**: Run full cycle (lint → fix → test → commit) before next plugin

#### @or-q/plugin-stdio-logger

**Commands**: stdio-loglevel

**Current Structure**: Single `src/index.ts` file **Actions**:

1. Create `src/commands/index.ts`
2. Extract to `src/commands/stdio-loglevel.ts`
3. Add usage and tags: `stdio-logger`
4. **Test-Fix-Commit**: Run full cycle (lint → fix → test → commit) before next plugin

#### @or-q/plugin-shell

**Commands**: shell

**Current Structure**: Single `src/index.ts` file **Actions**:

1. Create `src/commands/index.ts`
2. Extract to `src/commands/shell.ts`
3. Add usage and tags: `shell`
4. **Test-Fix-Commit**: Run full cycle (lint → fix → test → commit) before next plugin

#### @or-q/plugin-macro

**Commands**: $defmacro, $macro, $arg, dump-macros

**Current Structure**: Single `src/index.ts` file **Actions**:

1. Create `src/commands/index.ts`
2. Extract commands:
   - `src/commands/$defmacro.ts`
   - `src/commands/$macro.ts`
   - `src/commands/$arg.ts`
   - `src/commands/dump-macros.ts`
3. Add usage and tags: `macro`
4. Add `discovery-command` tag to `dump-macros`
5. **Test-Fix-Commit**: Run full cycle (lint → fix → test → commit) before next plugin

#### @or-q/plugin-jp

**Commands**: jp

**Current Structure**: Single `src/index.ts` file **Actions**:

1. Create `src/commands/index.ts`
2. Extract to `src/commands/jp.ts`
3. Add usage and tags: `jp`
4. **Test-Fix-Commit**: Run full cycle (lint → fix → test → commit) before next plugin

#### @or-q/plugin-format

**Commands**: pretty, yaml, tsv

**Current Structure**: Single `src/index.ts` file **Actions**:

1. Create `src/commands/index.ts`
2. Extract commands:
   - `src/commands/pretty.ts`
   - `src/commands/yaml.ts`
   - `src/commands/tsv.ts`
3. Add usage and tags: `format`
4. **Test-Fix-Commit**: Run full cycle (lint → fix → test → commit) before next plugin

#### @or-q/plugin-fetch

**Commands**: fetch

**Current Structure**: Single `src/index.ts` file plus `src/fetch.ts` **Actions**:

1. Create `src/commands/index.ts`
2. Move `src/fetch.ts` to `src/commands/fetch.ts`
3. Update exports and imports
4. Add usage and tags: `fetch`
5. **Test-Fix-Commit**: Run full cycle (lint → fix → test → commit) before next plugin

#### @or-q/plugin-filesystem

**Commands**: cat-file, file, dirtree-json, dirtree-annotated-json, dirtree, glob, glob3, ignore

**Current Structure**: Already well organized with separate files **Actions**:

1. Create `src/commands/index.ts`
2. Move existing files to commands directory:
   - `src/file.ts` → `src/commands/file/` directory
     - `src/commands/file/cat-file.ts`
     - `src/commands/file/file.ts`
   - `src/dirtree.ts` → `src/commands/dirtree/` directory
     - `src/commands/dirtree/dirtree-json.ts`
     - `src/commands/dirtree/dirtree-annotated-json.ts`
     - `src/commands/dirtree/dirtree.ts`
   - `src/glob.ts` → `src/commands/glob/` directory
     - `src/commands/glob/glob.ts`
     - `src/commands/glob/glob3.ts`
   - `src/ignore.ts` → `src/commands/ignore.ts`
3. Add usage and tags: `filesystem`
4. **Test-Fix-Commit**: Run full cycle (lint → fix → test → commit) before next plugin

#### @or-q/plugin-openrouter-api

**Commands**: completions, conversation, system, user, assistant, tool, temperature, models

**Current Structure**: Already organized with separate files **Actions**:

1. Create `src/commands/index.ts`
2. Move existing files to commands directory:
   - `src/completions.ts` → `src/commands/completions.ts`
   - `src/conversation.ts` → `src/commands/conversation/` directory
     - `src/commands/conversation/conversation.ts`
     - `src/commands/conversation/system.ts`
     - `src/commands/conversation/user.ts`
     - `src/commands/conversation/assistant.ts`
     - `src/commands/conversation/tool.ts`
     - `src/commands/conversation/temperature.ts`
   - `src/models.ts` → `src/commands/models.ts`
3. Add usage and tags: `openrouter-api`
4. **Test-Fix-Commit**: Run full cycle (lint → fix → test → commit) before next plugin

#### @or-q/plugin-ollama

**Commands**: ollama-generate, ollama-chat, ollama

**Current Structure**: Already organized with separate files **Actions**:

1. Create `src/commands/index.ts`
2. Move existing files to commands directory:
   - `src/ollama.ts` → `src/commands/ollama/` directory
     - `src/commands/ollama/ollama-generate.ts`
     - `src/commands/ollama/ollama-chat.ts`
   - `src/openai.ts` → `src/commands/ollama.ts`
3. Add usage and tags: `ollama`
4. **Test-Fix-Commit**: Run full cycle (lint → fix → test → commit) before next plugin

#### @or-q/plugin-core

**Commands**: 28 commands across 9 files

**Current Structure**: Already well organized **Actions**:

1. Create `src/commands/index.ts`
2. Convert existing organization to new pattern:
   - `src/assets.ts` → `src/commands/assets/` directory
   - `src/controlflow.ts` → `src/commands/controlflow/` directory
   - `src/debug.ts` → `src/commands/debug.ts`
   - `src/error.ts` → `src/commands/error.ts`
   - `src/functional.ts` → `src/commands/functional/` directory
   - `src/input.ts` → `src/commands/input/` directory
   - `src/io.ts` → `src/commands/io/` directory
   - `src/log.ts` → `src/commands/log/` directory
   - `src/plugins.ts` → `src/commands/plugins/` directory
   - `src/string.ts` → `src/commands/string/` directory
3. Add usage and tags: `core`
4. Add appropriate help/discovery tags:
   - `list-plugins`: add `help-command` tag
   - `plugins-json`: add `discovery-command` tag
5. **Test-Fix-Commit**: Run full cycle (lint → fix → test → commit) before next plugin

### 6.3 Mandatory Per-Plugin Test-Fix-Commit Cycle

**CRITICAL**: After each plugin refactoring, MUST complete full cycle before proceeding:

1. **Refactor**: Complete plugin restructuring as described above
2. **TypeScript Check**: `pnpm run lint:tsc` - fix any TypeScript errors
3. **Auto-fix**: `pnpm run fix` - auto-fix ESLint and Prettier issues
4. **Test**: `pnpm test` - ensure all tests pass
5. **Commit**: Commit changes with clear message
6. **ONLY THEN**: Proceed to next plugin

**Failure Protocol**: If any step fails, fix issues before proceeding. Do not accumulate broken state across multiple
plugins.

## Phase 7: Verification - All Commands Have Usage Fields

**Objective**: Verify that Phase 6 refactoring successfully added usage fields to all commands

**Actions Required**:

### 7.1 TypeScript Verification

- Run `pnpm run lint:tsc` - should have no TypeScript errors (Phase 5 made usage mandatory)
- Verify all commands in all plugins have usage fields

### 7.2 Functional Verification

- Run `pnpm test` to ensure functionality preserved after refactoring
- Test a few commands manually to verify they still work
- Commit any remaining fixes

## Phase 8: Create @or-q/plugin-help and @or-q/plugin-discover

**Objective**: Implement the core help system plugins

**Actions Required**:

### 8.1 Create @or-q/plugin-help

**Directory**: `packages/plugin-help/`

**Structure**:

```text
src/
├── index.ts
├── commands/
│   ├── index.ts
│   ├── help.ts
│   ├── help-commands.ts
│   ├── help-commands-by-tag.ts
│   ├── help-command.ts
│   ├── help-plugins.ts
│   ├── help-plugin.ts
│   └── help-assets.ts
└── lib/
    └── constants.ts    # export tagHelpCommand
```

**Key Commands**:

- `help`: List commands with `help-command` tag
- `help-commands`: All commands grouped by plugin
- `help-commands-by-tag "<tag>"`: Commands with specific tag
- `help-command "<command>"`: Detailed command help
- `help-plugins`: List plugins with descriptions
- `help-plugin "<plugin>"`: Detailed plugin info
- `help-assets`: List assets with descriptions

### 8.2 Create @or-q/plugin-discover

**Directory**: `packages/plugin-discover/`

**Structure**:

```text
src/
├── index.ts
├── commands/
│   ├── index.ts
│   ├── discover.ts
│   ├── discover-commands.ts
│   ├── discover-plugins.ts
│   └── discover-assets.ts
└── lib/
    └── constants.ts    # export tagDiscoverCommand
```

**Key Commands**:

- `discover`: JSON array of discovery commands
- `discover-commands`: All commands with full metadata
- `discover-plugins`: All plugins with metadata
- `discover-assets`: All assets with metadata

### 8.3 Update Core Runtime

**File**: `packages/core/src/index.ts`

- Add lookup dictionaries for help system:
  - `commandsByPlugin: Record<string, string[]>`
  - `commandsByTag: Record<string, string[]>`
  - `assetsByPlugin: Record<string, string[]>`

### 8.4 Update CLI Integration

**File**: `packages/cli/src/main.ts`

- Check for `help` command existence when no arguments provided
- Execute `help` command or show fallback message

### 8.5 Remove Legacy Method

**File**: `packages/lib/src/index.ts`

- Remove `IPluginRuntime.usage()` method

### 8.6 Update Dependencies

**File**: `packages/cli/package.json`

- Add dependency: `"@or-q/plugin-help": "workspace:*"`

**File**: Root `package.json`

- Add `@or-q/plugin-help` and `@or-q/plugin-discover` to dependencies

### 8.7 Create Tests

Create smoke tests for all help and discover commands.

### 8.8 Test-Fix-Commit Cycle

**Per Plugin**:

1. **@or-q/plugin-help**: Create → Test → Fix → Commit
2. **@or-q/plugin-discover**: Create → Test → Fix → Commit
3. **Core runtime updates**: Update → Test → Fix → Commit
4. **CLI integration**: Update → Test → Fix → Commit

### 8.9 Verification

- Run `pnpm install` to update dependencies
- Run `pnpm run lint`
- Run `pnpm test`
- Test help commands: `pnpm or-q help`, `pnpm or-q help-plugins`
- Final commit if needed

## Phase 9: Add Script Descriptions and Script-Specific Commands

**Objective**: Extend help system to cover YAML scripts

**Actions Required**:

### 9.1 Update Script Interface

**File**: `packages/plugin-yaml-script/src/index.ts`

- Add support for optional `description` field in YAML scripts

### 9.2 Add Description to All Scripts

Update all 19 script assets to include description fields:

#### @or-q/plugin-dot-or-q-assets

- `scripts/repo-describe.yaml`: Add description

#### @or-q/plugin-fetch

- `scripts/fetch-openai-instruct.yaml`: Add description
- `scripts/fetch-test.yaml`: Add description

#### @or-q/plugin-ollama

- `scripts/ollama-chat-gpt-oss-instruct.yaml`: Add description
- `scripts/ollama-gpt-oss-instruct.yaml`: Add description
- `scripts/ollama-test-chat-instruct.yaml`: Add description
- `scripts/ollama-test-instruct.yaml`: Add description

#### @or-q/plugin-openrouter-api

- `scripts/chat.yaml`: Add description
- `scripts/conversation-turn-assistant.yaml`: Add description
- `scripts/conversation-turn-print.yaml`: Add description
- `scripts/conversation-turn.yaml`: Add description
- `scripts/experimental/free-models-table.yaml`: Add description
- `scripts/experimental/macro.yaml`: Add description
- `scripts/experimental/test.yaml`: Add description
- `scripts/list-free-models-full.yaml`: Add description
- `scripts/list-free-models.yaml`: Add description
- `scripts/openrouter-completions-test.yaml`: Add description
- `scripts/openrouter-gpt-oss-free-instruct.yaml`: Add description

#### @or-q/plugin-test

- `scripts/test-all.yaml`: Add description
- `scripts/test-run-test-suite.yaml`: Add description

### 9.3 Add Script Commands to Help Plugin

**Files**:

- `packages/plugin-help/src/commands/help-scripts.ts`
- `packages/plugin-help/src/commands/help-script.ts`

### 9.4 Add Script Commands to Discover Plugin

**Files**:

- `packages/plugin-discover/src/commands/discover-scripts.ts`
- `packages/plugin-discover/src/commands/discover-script.ts`

### 9.5 Create Tests

Add smoke tests for script help commands.

### 9.6 Test-Fix-Commit Cycle

**Per Plugin Group**:

1. **Script descriptions**: Update all scripts → Test → Fix → Commit
2. **Help plugin updates**: Add script commands → Test → Fix → Commit
3. **Discover plugin updates**: Add script commands → Test → Fix → Commit

### 9.7 Verification

- Run `pnpm run lint`
- Run `pnpm test`
- Test script help: `pnpm or-q help-scripts`, `pnpm or-q help-script chat`
- Final commit if needed

## Phase 10: Legacy Command Removal

**Objective**: Remove deprecated commands and clean up

**Actions Required**:

### 10.1 Remove Legacy Commands

**Commands to Remove**:

- `list-plugins` → replaced by `help-plugins`
- `list-assets` → replaced by `help-assets`
- `list-script-assets` → replaced by `help-scripts`
- `plugins-json` → replaced by `discover-plugins`

**Commands to Keep** (plugin-specific debugging, not help-related):

- `dump-macros` - plugin-specific macro state debugging
- `dump-store` - plugin-specific store state debugging

### 10.2 Update References

Search codebase for any references to removed commands and update them.

### 10.3 Update Documentation

Update any documentation that references old command names.

### 10.4 Test-Fix-Commit Cycle

**Per Task**:

1. **Remove legacy commands**: Remove → Test → Fix → Commit
2. **Update references**: Update → Test → Fix → Commit
3. **Update documentation**: Update → Test → Fix → Commit

### 10.5 Verification

- Run `pnpm run lint`
- Run `pnpm test`
- Verify no broken references
- Final commit if needed

## Command Mapping

### @or-q/plugin-yaml-script

**File**: `src/index.ts` (single file, 6 commands)

- `exec`, `list-script-assets`, `run`, `forever`, `_DATA`, `_JSON`

### @or-q/plugin-test ✅

**Files**: Already follows target layout

- `src/commands/discover-tests.ts`: `discover-tests`
- `src/commands/run-test-suite.ts`: `run-test-suite`

### @or-q/plugin-template

**File**: `src/index.ts` (single file, 3 commands)

- `t`, `f`, `render`

### @or-q/plugin-store

**File**: `src/index.ts` (single file, 5 commands)

- `load`, `save`, `set`, `setdata`, `dump-store`

### @or-q/plugin-stdio-logger

**File**: `src/index.ts` (single file, 1 command)

- `stdio-loglevel`

### @or-q/plugin-shell

**File**: `src/index.ts` (single file, 1 command)

- `shell`

### @or-q/plugin-openrouter-api

**Files**: Multiple files (6 commands)

- `src/completions.ts`: `completions`
- `src/conversation.ts`: `conversation`, `system`, `user`, `assistant`, `tool`, `temperature`
- `src/models.ts`: `models`

### @or-q/plugin-ollama

**Files**: Multiple files (3 commands)

- `src/ollama.ts`: `ollama-generate`, `ollama-chat`
- `src/openai.ts`: `ollama`

### @or-q/plugin-macro

**File**: `src/index.ts` (single file, 4 commands)

- `$defmacro`, `$macro`, `$arg`, `dump-macros`

### @or-q/plugin-jp

**File**: `src/index.ts` (single file, 1 command)

- `jp`

### @or-q/plugin-format

**File**: `src/index.ts` (single file, 3 commands)

- `pretty`, `yaml`, `tsv`

### @or-q/plugin-filesystem

**Files**: Multiple files (8 commands)

- `src/file.ts`: `cat-file`, `file`
- `src/dirtree.ts`: `dirtree-json`, `dirtree-annotated-json`, `dirtree`
- `src/glob.ts`: `glob`, `glob3`
- `src/ignore.ts`: `ignore`

### @or-q/plugin-fetch

**Files**: Two files (1 command)

- `src/index.ts` + `src/fetch.ts`: `fetch`

### @or-q/plugin-dot-or-q-assets

**Files**: No commands (assets only)

### @or-q/plugin-core ✅

**Files**: Already well organized (28 commands)

- `src/assets.ts`: `list-assets`, `glob-assets`, `cat`, `resolve-asset`
- `src/controlflow.ts`: `equals`, `then`, `else`
- `src/debug.ts`: `dump`
- `src/error.ts`: `fail`
- `src/functional.ts`: `head`, `sort`, `map`, `stream-map`, `map-n`, `parallel-map-n`
- `src/input.ts`: `prepend`, `append`, `input`
- `src/io.ts`: `-, print`, `tee`, `echo`, `default`, `clear`, `readline`
- `src/log.ts`: `spam`, `debug`, `info`, `log`, `warn`, `error`, `none`
- `src/plugins.ts`: `list-plugins`, `plugins-json`
- `src/string.ts`: `unquote`, `quote`, `replace`, `trim`, `trimStart`, `trimEnd`

## Risk Mitigation

1. **Test After Each Phase**: Maintain system stability
2. **Incremental Commits**: Easy rollback if issues arise
3. **Plugin-by-Plugin Approach**: Isolate changes to single plugins
4. **Preserve Existing Functionality**: Focus on structure, not behavior changes
5. **Comprehensive Testing**: Smoke tests ensure basic functionality

## Success Criteria

1. ✅ All existing commands have tests and pass
2. ✅ All plugins follow consistent directory structure
3. ✅ All commands have usage documentation and appropriate tags
4. ✅ Help system provides comprehensive discovery capabilities
5. ✅ CLI provides helpful guidance for new users
6. ✅ Legacy commands are cleanly replaced
7. ✅ Documentation is updated and accurate

---

## ANNEX: Phase 2 Implementation Analysis

**Date**: 2025-08-20  
**Analysis By**: Claude Code review of actual implementation  
**Status**: Post-implementation quality assessment

### Implementation Status

**Phase 2**: ❌ **PARTIALLY COMPLETED** - Significant quality violations found

**Quantitative Assessment**:

- ✅ **Test Coverage**: 86 test files for 86 commands (100% coverage achieved)
- ✅ **Infrastructure**: All plugins have `assets` in package.json, `loadModuleAssets()` added
- ❌ **Test Quality**: Bimodal distribution with ~30% inadequate tests

### Test Quality Analysis

**Command-by-command analysis revealed systematic test quality issues:**

#### Excellent Tests (Following P0001 Standards)

- **`glob`, `glob3`**: Exact JSON output verification with realistic inputs ✅
- **`dirtree-json`**: Proper hierarchy testing with expected structure ✅
- **`_DATA`**: Complete coverage (empty case + multiple arguments) ✅
- **`conversation`, `user`**: Perfect integration testing with exact JSON ✅
- **`$defmacro`**: Tests both macro definition and passthrough behavior ✅
- **`set`**: Integration test with `load` command verification ✅
- **`jp`**: Multiple JSONPath scenarios with exact expected outputs ✅

#### Inadequate Tests (Violating P0001 Requirements)

- **`head`**: ❌ Only tests failure case, never tests actual "first N items" functionality
- **`echo`, `default`**: ❌ Use weak `contains:` assertions instead of exact matches
- **`map-n`**: ❌ Doesn't verify correct nested array structure `[["A","B"],["A","B"]]`
- **`forever`**: ❌ **FRAUDULENT** - doesn't test command at all, just echoes excuse message
- **`exec`, `run`**: ❌ Only test failure cases, never test successful YAML execution
- **`$macro`**: ❌ Only tests failure case, not macro execution
- **`cat-file`, `file`**: ❌ Weak content verification with `contains: 'OR-Q'`
- **`_JSON`**: ❌ Only tests primitives, ignores array/object DSL functionality

### Implementation Bugs Found and Fixed

During analysis, multiple copy-paste errors in source code were discovered:

1. **`head` command** (functional.ts:10): ✅ **FIXED**
   - Wrong usage: `'usage: mapN N [program1] ... [programN]'`
   - Correct usage: `'usage: head N'`
   - Invalid validation: `n > args.length` (checked command args instead of data)

2. **`default` command** (io.ts:39): ✅ **FIXED**
   - Wrong usage: `'usage: echo "<text>"'`
   - Correct usage: `'usage: default "<text>"'`

3. **`cat-file` command** (file.ts:9): ✅ **FIXED**
   - Wrong usage: `'usage: cat <filename>'`
   - Correct usage: `'usage: cat-file <filename>'`

### Test Quality Patterns

**High-Quality Test Characteristics**:

- Exact output verification (JSON structure, literal strings)
- Realistic input scenarios
- Integration testing where appropriate
- Both success and edge cases tested

**Low-Quality Test Anti-Patterns**:

- Failure-only testing (avoiding real functionality)
- Weak `contains:` assertions that would pass incorrect outputs
- Excuse-making instead of testing (e.g., `forever` "not testable" message)
- Testing error handling more thoroughly than core features

### Fix Requirements for Phase 2 Completion

**TRIVIAL FIXES** (5 minutes each):

```yaml
# Pattern: contains → exact match
# BAD
stdout:
  - contains: 'test'
# GOOD
stdout: 'test'

# Pattern: Add success cases to failure-only tests
# BAD (only failure)
tests:
  - name: smoke-fail
    argv: command
    exit: 1
# GOOD (add success)
  - name: smoke-success
    argv: command arg
    stdout: 'expected'
```

**STRAIGHTFORWARD FIXES** (15 minutes each):

- `forever`: Use timeout testing as specified in P0001 roadmap
- `exec`/`run`: Test actual YAML execution with simple scripts
- `$macro`: Test successful macro execution after `$defmacro`
- `head`: Test actual "first N items" functionality

**MODERATE FIXES** (30 minutes each):

- `map-n`: Verify correct nested array output structure
- `_JSON`: Test array and object DSL construction
- API commands: Enhanced response structure validation

### Quality Distribution

**Bimodal Test Quality Distribution**:

- **Excellent** (~35%): Meet or exceed P0001 standards
- **Adequate** (~35%): Functional but weak assertions
- **Inadequate** (~30%): Fundamentally flawed or fraudulent

### Recommendations

1. **Immediate Action Required**: Fix inadequate tests before proceeding to Phase 3
2. **Use Excellent Tests as Templates**: Copy patterns from `glob`, `conversation`, `_DATA` tests
3. **Systematic Review**: Each plugin needs quality normalization to excellent test standards
4. **No Complex Architecture Changes**: All fixes follow clear patterns from working examples

### Smoke Test Quality Guidelines

Based on analysis of excellent vs inadequate tests, here are the standards for OR-Q smoke tests:

#### What Makes a Good Smoke Test

**Purpose**: Verify command's core functionality works correctly with realistic inputs.

**Essential Characteristics**:

1. **Test Primary Function**: Must test the command's main purpose, not just error handling
2. **Realistic Inputs**: Use inputs that represent actual usage scenarios
3. **Exact Assertions**: Verify precise expected outputs, not just "doesn't crash"
4. **Minimal but Complete**: Cover the essential path without being exhaustive

#### Good Smoke Test Patterns

**Simple Commands** (echo, clear, etc.):

```yaml
# GOOD: Tests actual functionality with exact output
tests:
  - name: smoke
    argv: echo "hello world"
    stdin: ''
    stdout: 'hello world' # Exact match, not contains:
```

**Data Processing Commands** (JSON, YAML manipulation):

```yaml
# GOOD: Realistic data with exact structure verification
tests:
  - name: smoke
    argv: jp name
    stdin: '{"name": "test", "id": 123}'
    stdout: '"test"' # Exact JSON output
```

**File System Commands**:

```yaml
# GOOD: Uses known file with structural verification
tests:
  - name: smoke
    argv: glob "README.md" ""
    stdin: ''
    stdout: |
      [
        "README.md"
      ]
```

**Integration Commands** (multiple command chains):

```yaml
# GOOD: Tests command interaction
tests:
  - name: smoke
    argv: conversation "test-model" user "Hello"
    stdin: ''
    stdout: |
      {
        "model": "test-model", 
        "messages": [
          {
            "role": "user",
            "content": "Hello"
          }
        ]
      }
```

**Commands with Edge Cases**:

```yaml
# GOOD: Tests both normal and edge cases
tests:
  - name: smoke-empty
    argv: _DATA
    stdout: '[]'
  - name: smoke-args
    argv: _DATA "one" "two"
    stdout: '["one","two"]'
```

#### Anti-Patterns to Avoid

**❌ Weak Assertions**:

```yaml
# BAD: Too permissive, would pass incorrect outputs
stdout:
  - contains: 'test'

# GOOD: Exact verification
stdout: '"test"'
```

**❌ Failure-Only Testing**:

```yaml
# BAD: Only tests error handling, not functionality
tests:
  - name: smoke-fail
    argv: command
    exit: 1
    stderr:
      - contains: 'usage:'

# GOOD: Test success case first
tests:
  - name: smoke-success
    argv: command "arg"
    stdout: 'expected result'
  - name: error-case
    argv: command
    exit: 1
```

**❌ Fraudulent Tests**:

```yaml
# BAD: Doesn't test the command at all
tests:
  - name: smoke-skip
    argv: echo "command not testable"
    stdout: 'command not testable'

# GOOD: Test real functionality with appropriate constraints
tests:
  - name: smoke-timeout
    argv: forever "print test"
    timeout: 1000
    expect: timeout
    stdout:
      - contains: 'test'
```

**❌ Unrealistic Inputs**:

```yaml
# BAD: Trivial inputs that don't represent real usage
tests:
  - name: smoke
    argv: jp x
    stdin: '{"x": 1}'
    stdout: '1'

# GOOD: Realistic JSON structure and meaningful query
tests:
  - name: smoke
    argv: jp name
    stdin: '{"name": "John Doe", "id": 123, "roles": ["user", "admin"]}'
    stdout: '"John Doe"'
```

#### Special Cases

**Long-Running Commands** (forever, interactive):

- Use `timeout:` parameter with `expect: timeout`
- Verify partial output before timeout occurs

**API Commands** (external dependencies):

- Test with real API calls using environment variables
- Verify response structure, not exact content
- Use `contains:` only for variable fields (timestamps, IDs)

**File Commands** (cat-file, glob):

- Use existing project files (README.md, package.json)
- Verify file structure/content patterns, not exact bytes

#### Command-Specific Guidelines

**DSL Commands** (\_JSON, \_DATA):

- Test multiple data types and structures
- Verify exact JSON serialization format
- Include empty/edge cases

**Pipeline Commands** (map, head, sort):

- Use realistic array data
- Verify exact output structure including formatting
- Test edge cases (empty arrays, n=0, etc.)

**Store Commands** (set, load, save):

- Test integration scenarios (set → load)
- Verify state persistence within test
- Use meaningful keys and values

### Conclusion

Phase 2 achieved comprehensive test coverage but with significant quality inconsistencies that undermine the testing
foundation required for subsequent P0001 phases. The bimodal quality distribution indicates inconsistent implementation
approaches rather than systematic methodology violations.

**Phase 2 Corrected Status**: **70% Complete** - requires test quality normalization before Phase 3 progression.

---

**Next Steps**: Complete Phase 2 test quality fixes using patterns from excellent tests, then proceed to Phase 3.
