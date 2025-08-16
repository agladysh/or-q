# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Linting and Code Quality

- `pnpm run lint` - Run all linting (TypeScript, ESLint, Prettier)
- `pnpm run lint:tsc` - TypeScript type checking only
- `pnpm run lint:eslint` - ESLint only
- `pnpm run lint:prettier` - Prettier format checking only
- `pnpm run fix` - Auto-fix ESLint and Prettier issues
- `pnpm run fix:eslint` - Auto-fix ESLint issues only
- `pnpm run fix:prettier` - Auto-fix Prettier formatting only

### Testing

- `pnpm run test` - Run tests (currently just runs linting)
- `pnpm run pretest` - Pre-test hook that runs linting

### Package Management

- Uses `pnpm` with workspaces defined in `pnpm-workspace.yaml`
- All packages are in `packages/*` directories
- Uses `workspace:*` for internal package dependencies

## Architecture Overview

OR-Q is a plugin-based CLI tool for orchestrating command pipelines, with a focus on interacting with AI models and
services like OpenRouter and Ollama. It is built with TypeScript and Node.js and features a modular plugin system where
each plugin provides commands and assets.

The core of OR-Q is a command pipeline where each command receives an input (either a string or a Readable stream) and
produces an output of the same type. This allows for chaining commands together to perform complex data transformations.

### Design Principles

- **KISS, YAGNI, DRY** - Keep it simple, you aren't gonna need it, don't repeat yourself
- **Ingest as YAML, output JSON** - Standard data flow convention
- **Do not pretty-print JSON, but append trailing newline** - Consistent JSON output format

### Development Philosophy

**Prototype Phase**: OR-Q (initiated 2025-08-05) is currently a functional prototype balancing:

1. **Immediate Utility** - Rapidly implement working, end-to-end system that is immediately useful
2. **Long-Term Rigor** - Build foundation that can mature into robust, performant, formally-designed engine

**Architectural Evolution**: Current "as-is" prototype architecture has documented limitations with clear path to
"to-be" target architecture outlined in TODO.md and codebase.

### Core Components

**Main Entry Point (`packages/cli/src/main.ts`)**

- CLI entry point that loads plugins from node_modules
- Processes command-line arguments and pipes input/output
- Uses Node.js experimental features: `--experimental-strip-types`, `--env-file-if-exists=.env`

**Plugin Runtime (`packages/core/src/index.ts`)**

- Central plugin loading and command execution system
- Auto-discovers plugins matching pattern `@or-q/plugin-*` or `or-q-plugin*`
- Provides event system for plugin communication
- Manages execution context stack for nested command calls
- Commands are resolved and executed in sequence with piped input/output

**Library (`packages/lib/src/index.ts`)**

- Shared types and utilities for plugin development
- Core interfaces: `Plugin`, `Command`, `IPluginRuntime`
- Asset loading system supporting `plugin:` URIs and file paths
- Command argument parsing and validation helpers
- Spawning utilities for external processes

### Plugin System

#### Plugin Structure

Each plugin exports a default object with:

- `name`: Package name from package.json
- `commands`: Object mapping command names to Command implementations
- `assets`: Optional assets loaded from `../assets` directory (typically YAML scripts)
- `eventListeners`: Optional event handlers for runtime events

#### Key Plugins

- `plugin-core`: Essential commands (assets, debug, formats, input, io, log, plugins, string)
- `plugin-openrouter-api`: OpenRouter API integration (completions, conversation, models)
- `plugin-yaml-script`: YAML-based scripting system with `run`, `exec`, `fail`, `forever` commands
- `plugin-shell`, `plugin-store`, `plugin-filesystem`: System integration
- `plugin-macro`: Macro functionality
- `plugin-template`, `plugin-format`, `plugin-jp`: Data processing utilities

#### YAML Script System (`packages/plugin-yaml-script/`)

- Declarative command execution using YAML files
- Scripts can specify `requires` for plugin dependencies
- Support for `on-empty-stdin` conditional execution
- Asset system allows bundled scripts accessible via `plugin:` URIs
- Commands can be strings, arrays, or objects with nested structure

### Code Conventions

#### TypeScript Configuration

- Uses modern ES2022 target with ESNext modules
- Bundler module resolution with path mapping for `@or-q/*` packages
- Strict mode enabled with comprehensive type checking
- Declaration files generated to `dist/` directory

#### ESLint Configuration

- Based on recommended TypeScript ESLint config
- Treats warnings as errors
- Prohibits TODO/FIXME comments in code (use TODO.md instead)
- Enforces consistent type imports
- Comprehensive unused variable detection with underscore prefix ignore pattern

#### File Structure Patterns

- Each package has `src/` directory with TypeScript source
- Assets (YAML scripts) in `assets/` subdirectories
- Plugin index files import and merge sub-modules using `mergeCommands()`
- Package.json imports use `with { type: 'json' }` syntax

#### Development Notes

- Comments marked with "Lazy" indicate areas that may potentially need improvement in the future
- Command-line tools should use `commandArgument()` helper for parameter validation
- Asset resolution supports `plugin:`, `file:///`, and relative path schemes
- Logging system uses structured events with configurable levels (spam, debug, info, log, warn, error, none)
- Context management allows plugins to share state during command execution
- Usage strings currently hardcoded in `commandArgument()` calls - these should be extracted to command metadata
- Plugin descriptions should be exported from package.json to Plugin interface
- Command-to-plugin mapping lost during runtime flattening - requires reverse-engineering or enhanced runtime

### Testing Strategy

The project plans to implement declarative black-box tests using YAML files in `packages/**/tests/**/*.yaml` format,
specifying environment, arguments, stdin, and expected stdout/stderr.

### Output and Logging Architecture

**Event-Driven Logging System**:

- Plugins emit structured logging events via `runtime.emit(loggingEventName, event)`
- Events contain `source`, `level` (spam/debug/info/log/warn/error/none), and `value` fields
- Event listeners are registered during plugin initialization and executed synchronously
- Multiple logging plugins can listen to the same events simultaneously

**stdio-logger Plugin Behavior**:

- Registers event listener for `loggingEventName` events during plugin loading
- Filters events by configurable log level (`logLevelOrd`)
- Writes immediately to `process.stdout` (via `Console.log`) when events are received
- Uses tab-separated format: `${level}\t${plugin-name}\t${message}`
- Event processing is synchronous - no buffering or deferral

**CLI Output Flow**:

- Main CLI (`packages/cli/src/main.ts`) awaits complete `runtime.runCommands()` execution
- Only writes final command chain result to `process.stdout` after full completion
- Exception: `PluginRuntimeFailure` errors are caught and written to `process.stderr`

**Output Ordering Implications**:

- Event logs appear immediately during command execution (synchronous)
- CLI result output appears after all commands complete (post-async)
- Commands that produce both intermediate output and final results may have interleaved timing
- No coordination between event-driven logging and CLI result output streams

### Development Guide

#### Plugin System Architecture

**Runtime Initialization** (`packages/core/src/index.ts:102-108`):

- `PluginRuntime.fromNodeModules()` uses `installed-node-modules` to discover packages
- Plugin discovery via regex `/((^@or-q\/plugin-)|(or-q-plugin))/` against all installed packages
- Dynamic imports of discovered plugins: `(await Promise.all(pluginNames.map((name) => import(name))))`
- Each plugin module must export default object conforming to `Plugin` interface

**Plugin Loading Process** (`packages/core/src/index.ts:76-89`):

- Constructor receives array of Plugin objects
- `resolveRecord(pluginsArray, 'commands')` flattens all plugin commands into single registry
- Commands can be overridden (with process warning): "plugin X overrode previously set commands value Y"
- `resolveRecord(pluginsArray, 'assets', true)` creates prefixed asset registry: `plugin:package-name/path`
- Event listeners from all plugins registered on shared EventEmitter

**Command Resolution and Execution** (`packages/core/src/index.ts:209-268`):

- `runCommands(input, program)` processes argument array sequentially
- Each command lookup: `this.commands[command]` from merged registry
- Command execution: `await this.commands[command].run(input, args, this)`
- Input type validation after each command: must be `string | Readable`
- Error context generation with command stack trace and failure point marking

#### Command Implementation Patterns

**Standard Command Structure** (see `packages/plugin-core/src/*.ts`):

```typescript
const commands: Commands = {
  commandName: {
    description: 'human readable description',
    run: async (input: string | Readable, args: Arguments, runtime: IPluginRuntime): Promise<string | Readable> => {
      // Command implementation
    },
  },
};
```

**Argument Processing**:

- `commandArgument(runtime, args.shift(), usage)` - validates and consumes next argument
- Usage pattern: provides error message if argument missing
- Arguments consumed via `args.shift()` - modifies array in place

**Input/Output Handling**:

- Input is either `string` or Node.js `Readable` stream
- `readableToString(input)` converts Readable to string when needed
- Commands must return `string | Readable` - enforced by runtime validation
- Stream processing via Node.js Readable: `Readable.fromWeb()`, `process.stdin`, etc.

#### Script Execution System

**YAML Script Loading** (`packages/plugin-yaml-script/src/index.ts:281-303`):

- `run` command accepts URI argument: filesystem path or plugin asset reference
- Asset resolution priority: 1) Direct URI via `resolveAsset()`, 2) Plugin glob search, 3) Filesystem
- Plugin script search: `assetGlob(runtime, 'plugin:*/**/scripts/**/${uri}.yaml')`
- Multiple matches generate process warning, uses first match
- Filesystem paths: `./relative` or `/absolute` - anything not starting with plugin:

**YAML to Command Translation** (`packages/plugin-yaml-script/src/index.ts:195-206`):

- `loadCommands(commands)` recursively processes YAML structure
- Supports nested arrays: `[[cmd1, arg1], [cmd2, arg2]]`
- Object syntax: `{command: args}` where args can be string, array, or nested structure
- Special `_RAW` directive: `{_RAW: [command_list]}` inlines command sequence
- `_JSON` directive: converts structured data to JSON command arguments (embeds JSON objects directly in YAML scripts)

**Script Format** (example analysis of `fetch-test.yaml`):

- `requires:` array - declares plugin dependencies (validation only)
- `commands:` array - command sequence to execute
- Macro system: `$defmacro` defines reusable command templates with parameter substitution

#### Testing and Debugging

**CLI Execution Modes**:

- Single command: `pnpm or-q command arg1 arg2`
- Internal pipeline: `pnpm or-q echo "input" command1 command2` (preferred - no shell pipes needed)
- External pipeline: `echo input | pnpm or-q command | pnpm or-q another` (avoid - requires shell approval)
- Script execution: `pnpm or-q run script-name`

**Important**: OR-Q implements internal command chaining. Shell pipes like `echo "test" | pnpm or-q foo | pnpm or-q bar`
should be replaced with `pnpm or-q echo "test" foo bar` for efficiency and to avoid shell approval prompts.

**Error Handling Architecture**:

- Commands throw `PluginRuntimeFailure` via `fail(message)` function
- CLI catches and outputs to stderr: `process.stderr.write(e.message)`
- Uncaught exceptions logged via `console.error('Unexpected error:', e)`
- Command failures generate detailed stack trace with numbered command list and failure point marking

**Debugging Techniques**:

- Use `tee` command to inspect intermediate pipeline values at any point
- Check API responses directly with curl to verify expected vs actual response format
- Examine command argument parsing with spam-level logging events
- Validate `_JSON` directive output by testing individual components
- Add debugging `tee` commands liberally during development, remove only after confirming fixes work

**Common Error Patterns**:

- `"input is null"`: JSONPath query returned no results (often due to API error responses)
- `"invalid resulting input type; object"`: Command returned wrong type instead of `string | Readable`
- Fetch errors: Usually body serialization issues (object vs string for JSON requests)
- API error responses: Valid JSON with `{"error": {...}}` structure instead of expected data
- Plugin interface type errors: `assets` field incorrectly typed as `Commands` instead of `Assets`
- Missing metadata: Commands lack usage strings, plugins lack descriptions, assets lack documentation

### Architectural Constraints

#### Why Optional Arguments Are Impossible

The OR-Q pipeline architecture has a fundamental constraint that makes optional arguments impossible in the current
design. This emerges from the sequential consumption model:

**The args.shift() Pattern**:

- Commands use `args.shift()` to consume arguments destructively
- No lookahead capability - commands cannot inspect upcoming arguments without consuming them
- No backtracking - once consumed, arguments cannot be "put back"
- Greedy consumption problem: optional arguments cannot know whether to consume the next argument

**Limited Workaround - Command Name Collision Detection**:

```typescript
// Pseudo-optional argument pattern:
if (args.length > 0 && !(args[0] in runtime.commands)) {
  // args[0] is not a command, safe to consume as optional argument
  topic = await commandArgument(runtime, args.shift(), 'usage: help [topic]');
}
```

**Constraints**: Optional arguments cannot match command names, limited to simple string arguments, namespace-dependent
behavior.

**Future Solution**: Planned architectural evolution to schema-typed arguments with `(command, arguments)` tuple
structure and compile-time validation.

### Program Representation Evolution

**Current (As-Is)**: `Arguments` type as `(string | Arguments)[]` - nestable array of strings generated from:

- **ARGV Form**: Command-line arguments parsed directly
- **YAML Form**: Compiled by `@or-q/plugin-yaml-script` using `_JSON`/`_RAW` directives

**Target (To-Be)**: Formal `(command, arguments)` tuple where `arguments` is schema-defined object

- Enables static validation via schemas (e.g., `arktype`)
- Supports first-class, typed, and optional arguments
- More robust and unambiguous program form

### Stream Processing Architecture

**Type Contract Enforcement**:

- Runtime validates `string | Readable` contracts after each command execution
- Invalid types (objects, arrays, numbers) cause pipeline failure
- Commands use `readableToString(input)` for string conversion when needed

**Pipeline Data Flow**:

- Sequential command execution with output piped to next command's input (Forth-like stack execution)
- `PluginRuntime.runCommands` loop consumes `Arguments` array via `args.shift()`
- Each instruction operates on persistent `input` data value (`string | Readable`)
- Internal pipeline: `pnpm or-q echo "hello" trim quote` → `echo` outputs "hello" → `trim` processes it → `quote` wraps
  in quotes
- `tee` command: outputs to stdout while preserving pipeline flow
- Pass-through semantics: many commands perform side effects while maintaining pipeline integrity
- Error transparency: API error responses flow through pipeline as valid data
- **Efficiency**: Internal chaining eliminates shell overhead and approval prompts

**Execution Model Evolution**:

- **Current**: Text-only contract (`string | Readable`) with serialization overhead
- **Target**: Structured objects (JavaScript objects/arrays) passed directly in memory
- **Benefits**: Eliminates overhead and command clutter (`jp`, `unquote`, `to-json`)

**HTTP Integration Patterns**:

- `_JSON` directive: creates structured request configuration at compilation time
- `fetch` command: parses input as YAML config, handles body serialization for JSON requests
- Response processing: returns `Readable` stream via `Readable.fromWeb()`
- Error handling: APIs return valid JSON for errors, pipeline continues processing

### Advanced Plugin Patterns

**Context-Based Communication**:

- Stack-based contexts: `pushContext/popContext` for nested execution scopes
- Namespaced context IDs: `context:${pkg.name}:${feature}` prevents collisions
- Type-safe context retrieval: `getContext<T>()` with undefined fallback
- Automatic cleanup: context popped in finally blocks for exception safety

**Event-Driven Architecture**:

- Plugins emit structured events via `runtime.emit(loggingEventName, event)`
- Events contain `source`, `level`, and `value` fields
- Synchronous event processing for immediate feedback
- Multiple plugins can listen to the same events simultaneously

**Asset Resolution Hierarchy**:

- URI scheme dispatch: `plugin:`, `file:///`, relative paths handled differently
- Fallback chain: Direct URI → plugin glob search → filesystem resolution
- Multiple match handling: warnings for ambiguous matches, first-wins selection
- Glob-based discovery: `assetGlob()` for pattern matching across plugin assets

### Help System Implementation (P0001)

**Design Principles**:

- Explicit command structure instead of fighting architectural constraints
- Separation of concerns: human-readable `help-*` vs machine-readable `discover-*` commands
- CLI integration: check for `help` command existence, provide fallback recommendations
- Programmatic content generation using existing metadata

**Command Structure**:

**@or-q/plugin-help Package**:

- `help` - Lists all commands with `help-command` tag in alphabetical order
- `help-commands` - List all commands with descriptions, grouped by plugin
- `help-commands-by-tag "<tag>"` - List all commands with specific tag
- `help-command "<command>"` - Prints command description and usage string
- `help-plugins` - Lists all available plugins with descriptions, sorted alphabetically
- `help-plugin "<plugin.name>"` - Shows detailed plugin information including commands and assets
- `help-assets` - Lists all available assets with descriptions and plugin sources
- `help-scripts` - Lists all available YAML scripts with descriptions
- `help-script "<script>"` - Shows detailed help for specific script

**@or-q/plugin-discover Package**:

- `discover` - Returns JSON array of all commands with `discovery-command` tag
- `discover-commands` - Returns JSON array of all commands with full metadata
- `discover-plugins` - Returns JSON array of all plugins with metadata
- `discover-assets` - Returns JSON array of all assets with metadata
- `discover-scripts` - Returns JSON array of all YAML scripts with metadata
- `discover-script "<script>"` - Displays full script YAML

**Interface Enhancements Required**:

```typescript
// Enhanced Command interface
export interface Command {
  description: string;
  usage?: string; // New: extracted from hardcoded commandArgument() calls
  tags?: string[]; // New: for categorization (help-command, discovery-command)
  run: (input: string | Readable, args: Arguments, runtime: IPluginRuntime) => Promise<string | Readable>;
}

// Enhanced Plugin interface
export interface Plugin<E extends IPluginRuntimeEvent = IPluginRuntimeEvent> {
  name: string;
  description?: string; // New: from package.json description
  eventListeners?: IPluginRuntimeEventListeners<E>;
  assets?: Assets; // Fix: was incorrectly typed as Commands
  commands?: Commands;
}

// Enhanced Script interface
interface Script {
  description?: string; // New: for help system
  requires: [string];
  ['on-empty-stdin']: CommandList;
  commands: CommandList;
}
```

**Legacy Command Migration**:

- `list-plugins` → `help-plugins`
- `list-assets` → `help-assets`
- `list-script-assets` → `help-scripts`
- `plugins-json` → `discover-plugins`
- `dump-macros` → `discover-macros`
- `dump-store` → `discover-store`

**Implementation Strategy**:

- Create both `@or-q/plugin-help` and `@or-q/plugin-discover` packages
- Export tag constants: `tagHelpCommand`, `tagDiscoverCommand`
- Update CLI to use help command when invoked with no arguments
- Remove "Lazy" `runtime.usage()` method from core
- Reorganize commands to `src/commands/` directories (one file per command)
- Extract usage strings from hardcoded `commandArgument()` calls to command metadata

### Development Best Practices

**Code Quality Standards**:

- Always run `pnpm run lint` before making changes
- Use `pnpm run fix` to auto-fix ESLint and Prettier issues
- No TODO/FIXME comments in code - use TODO.md instead
- Comments marked "Lazy" indicate areas for potential future improvement

**Current Development Priorities** (from TODO.md):

1. **First Priority**:
   - Implement P0001: Help System
   - Find `Lazy` with `TODO` and migrate to TODO.md

2. **Low Hanging Fruits**:
   - Replace `JSON.parse(JSON.stringify())` with modern `structuredClone()` calls
   - Forbid `console.*` in eslint, emit logging events instead
   - Split `@or-q/lib/index.ts` to files
   - Cleanup random files in `plugin-openrouter-api/assets/scripts`
   - Ensure JSON output has trailing newline without pretty-printing

3. **Technical Debt**:
   - Move commands to separate files (ref: core plugin structure)
   - Implement exponential backoffs on 429 errors for all fetch() calls
   - Move `fail()` to `IPluginRuntime` interface as `abort()`
   - Add proper CS-rigorous raw program form for nestable command/argument chains

**Plugin Development Guidelines**:

- Export default object conforming to `Plugin` interface
- Use `mergeCommands()` for combining command sets
- Implement proper error handling with `fail()` function
- Support both string and Readable input types
- Emit structured logging events appropriately
- Test asset loading and URI resolution thoroughly
- Include `description: pkg.description` in plugin definition
- Define usage strings as constants in command files, reference in both `run()` and `Command.usage`
- Add appropriate tags to commands for help system categorization
- Organize commands in `src/commands/` directory structure (one file per command)

**Library Core (`packages/lib/src/index.ts`)**:

**Type Definitions**:

- `Arguments`: `(string | Arguments)[]` - Core nestable program representation
- `Command`: Interface with `description` and `run` method
- `Commands`: `Record<string, Command>` - Command registry type
- `Assets`: `Record<string, string>` - Asset registry type
- `IPluginRuntime`: Core runtime interface with plugins, commands, assets, context management

**Command Processing**:

- `commandArgument(runtime, arg, usage, input)` - Standard argument processor (marked "Lazy. Too low-level.
  Rearchitect.")
- `runCommandsInContext(runtime, input, program, id, data)` - Execute commands with context stack management
- `mergeCommands(pluginName, commands[])` - Merge command sets with conflict warnings

**Process Integration**:

- `spawnText(cmd, input, opts)` - Execute external commands with stdin/stdout streaming and timeout support
- `SpawnOptions`: Configuration for external process execution (args, timeout, shell)

**Stream Processing**:

- `readableToString(readable)` - Convert Readable stream to string using async iteration
- Type contract: Commands must return `string | Readable`

**Asset Management**:

- `loadAssets(dirname, options?)` - Load all files from directory using glob patterns (marked "Lazy. Optimizable.")
- `loadModuleAssets(importMetaUrl, options?, subdir)` - Load plugin assets relative to module
- `resolveAsset(runtime, uri)` - Resolve asset URI (`plugin:`, `file:///`, filesystem paths)
- `assetGlob(runtime, pattern, options?)` - Filter assets by glob pattern

**Error Handling**:

- `PluginError` - Base plugin error class
- `PluginRuntimeFailure` - Standard command failure exception
- `fail(message)` - Throw PluginRuntimeFailure with message

**Logging System**:

- `LogLevel`: `'spam' | 'debug' | 'info' | 'log' | 'warn' | 'error' | 'none'`
- `LoggingEvent`: Event structure with `source`, `level`, `value`
- Event system for inter-plugin communication

**Plugin Architecture**:

- `Plugin<E>`: Interface with `name`, `eventListeners?`, `assets?`, `commands?`
- `getPlugin<T>(runtime, name)` - Type-safe plugin retrieval with error handling

**Creating New Plugins**:

1. Create directory in `packages/` following pattern `@or-q/plugin-name`
2. Create `package.json` with correct name field
3. Create `src/index.ts` as main entry point
4. Export default object conforming to `Plugin` interface
5. Add commands with `description` and `run` method

**Creating New Commands**:

1. Add entry to `commands` object in plugin's `index.ts`
2. Key is command name, value has `description` and `run` method
3. `run` method: async function taking `input`, `args`, `runtime` parameters
4. Must return `Promise<string | Readable>`

**Testing Approach**:

- Test command chains with various input types
- Use `debug` command for runtime inspection
- Verify plugin loading with `plugins` command
- Monitor event flow through logging system
- Test with actual external services to catch integration issues
