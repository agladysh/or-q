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

Create basic smoke test for each command:

- Use plugin-test pattern: one test file per command in `assets/tests/commands/`
- Focus on basic invocation, not full functionality
- Handle commands requiring arguments or environment variables gracefully

### 2.3 Verification

- Run `pnpm test` and ensure all tests pass
- Commit changes

## Phase 3: Add Mandatory Plugin.description Field

**Objective**: Enable plugin-level help by adding description metadata

**Actions Required**:

### 3.1 Update Core Interface

**File**: `packages/lib/src/index.ts`

- Add mandatory `description: string` field to `Plugin` interface
- Update all type definitions that depend on Plugin interface

### 3.2 Update All Plugin Definitions

Update `src/index.ts` for each plugin to add `description: pkg.description`:

#### Simple Updates (single index.ts file)

- **@or-q/plugin-yaml-script**: `packages/plugin-yaml-script/src/index.ts`
- **@or-q/plugin-template**: `packages/plugin-template/src/index.ts`
- **@or-q/plugin-store**: `packages/plugin-store/src/index.ts`
- **@or-q/plugin-stdio-logger**: `packages/plugin-stdio-logger/src/index.ts`
- **@or-q/plugin-shell**: `packages/plugin-shell/src/index.ts`
- **@or-q/plugin-macro**: `packages/plugin-macro/src/index.ts`
- **@or-q/plugin-jp**: `packages/plugin-jp/src/index.ts`
- **@or-q/plugin-format**: `packages/plugin-format/src/index.ts`
- **@or-q/plugin-fetch**: `packages/plugin-fetch/src/index.ts`
- **@or-q/plugin-dot-or-q-assets**: `packages/plugin-dot-or-q-assets/src/index.ts`

#### Already Correct

- **@or-q/plugin-test**: Already follows target pattern
- **@or-q/plugin-core**: No description export needed (different pattern)

#### Complex Updates (multiple source files)

- **@or-q/plugin-openrouter-api**: `packages/plugin-openrouter-api/src/index.ts`
- **@or-q/plugin-ollama**: `packages/plugin-ollama/src/index.ts`
- **@or-q/plugin-filesystem**: `packages/plugin-filesystem/src/index.ts`

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
5. Test and commit

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
4. Test and commit

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
5. Test and commit

#### @or-q/plugin-stdio-logger

**Commands**: stdio-loglevel

**Current Structure**: Single `src/index.ts` file **Actions**:

1. Create `src/commands/index.ts`
2. Extract to `src/commands/stdio-loglevel.ts`
3. Add usage and tags: `stdio-logger`
4. Test and commit

#### @or-q/plugin-shell

**Commands**: shell

**Current Structure**: Single `src/index.ts` file **Actions**:

1. Create `src/commands/index.ts`
2. Extract to `src/commands/shell.ts`
3. Add usage and tags: `shell`
4. Test and commit

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
5. Test and commit

#### @or-q/plugin-jp

**Commands**: jp

**Current Structure**: Single `src/index.ts` file **Actions**:

1. Create `src/commands/index.ts`
2. Extract to `src/commands/jp.ts`
3. Add usage and tags: `jp`
4. Test and commit

#### @or-q/plugin-format

**Commands**: pretty, yaml, tsv

**Current Structure**: Single `src/index.ts` file **Actions**:

1. Create `src/commands/index.ts`
2. Extract commands:
   - `src/commands/pretty.ts`
   - `src/commands/yaml.ts`
   - `src/commands/tsv.ts`
3. Add usage and tags: `format`
4. Test and commit

#### @or-q/plugin-fetch

**Commands**: fetch

**Current Structure**: Single `src/index.ts` file plus `src/fetch.ts` **Actions**:

1. Create `src/commands/index.ts`
2. Move `src/fetch.ts` to `src/commands/fetch.ts`
3. Update exports and imports
4. Add usage and tags: `fetch`
5. Test and commit

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
4. Test and commit

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
4. Test and commit

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
4. Test and commit

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
5. Test and commit

### 6.3 Per-Plugin Testing

After each plugin refactoring:

1. Run `pnpm run lint` to check TypeScript
2. Run `pnpm test` to ensure functionality preserved
3. Test a few commands manually
4. Commit changes

## Phase 7: Make Command.usage Field Mandatory (Revisited)

**Objective**: Enforce usage documentation now that all commands have it

**Actions Required**:

### 7.1 Update Core Interface

**File**: `packages/lib/src/index.ts`

- Ensure `usage: string` is mandatory in `Command` interface

### 7.2 Verification

- Run `pnpm run lint` - should have no TypeScript errors
- Run `pnpm test` to ensure functionality preserved
- Commit changes

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

### 8.8 Verification

- Run `pnpm install` to update dependencies
- Run `pnpm run lint`
- Run `pnpm test`
- Test help commands manually: `pnpm or-q help`, `pnpm or-q help-plugins`
- Commit changes

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

### 9.6 Verification

- Run `pnpm run lint`
- Run `pnpm test`
- Test script help: `pnpm or-q help-scripts`, `pnpm or-q help-script chat`
- Commit changes

## Phase 10: Legacy Command Removal

**Objective**: Remove deprecated commands and clean up

**Actions Required**:

### 10.1 Remove Legacy Commands

**Commands to Remove**:

- `list-plugins` → replaced by `help-plugins`
- `list-assets` → replaced by `help-assets`
- `list-script-assets` → replaced by `help-scripts`
- `plugins-json` → replaced by `discover-plugins`
- `dump-macros` → replaced by `discover-macros` (if implementing)
- `dump-store` → replaced by `discover-store` (if implementing)

### 10.2 Update References

Search codebase for any references to removed commands and update them.

### 10.3 Update Documentation

Update any documentation that references old command names.

### 10.4 Verification

- Run `pnpm run lint`
- Run `pnpm test`
- Verify no broken references
- Commit changes

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

**Next Steps**: Begin Phase 2 - Implement smoke tests for all commands to establish baseline functionality before making
structural changes.
