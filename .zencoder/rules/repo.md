---
description: Repository Information Overview
alwaysApply: true
---

# OR-Q Information

## Summary

OR-Q (OpenRouter Query) is a porcelain tool with a plugin-based architecture for interacting with OpenRouter API. The
project is organized as a monorepo using pnpm workspaces, containing multiple packages that provide core functionality
and various plugins.

## Structure

- **packages/**: Contains all project packages
  - **cli/**: Command-line interface for OR-Q
  - **core/**: Core functionality and plugin runtime
  - **lib/**: Shared library code
  - **plugin-\*/**: Various plugins extending functionality
- **dist/**: Build output directory
- **.github/**: GitHub configuration files

## Language & Runtime

**Language**: TypeScript **Version**: TypeScript 5.9.2 **Node Version**: ES2022 target **Build System**: pnpm **Package
Manager**: pnpm 10.13.1

## Dependencies

**Main Dependencies**:

- Internal workspace packages (@or-q/\*)
- Node.js built-in modules

**Development Dependencies**:

- typescript: ^5.9.2
- eslint: ^9.32.0
- prettier: ^3.6.2
- markdownlint-cli: ^0.45.0
- lefthook: ^1.12.2
- @types/node: ^24.2.0

## Build & Installation

```bash
# Install dependencies
pnpm install

# Lint code
pnpm run lint

# Fix linting issues
pnpm run fix

# Build TypeScript declarations
pnpm run prepack
```

## Development Workflow

### Essential Commands

Always use these pnpm commands for development tasks:

- `pnpm run lint` - Run all linting (TypeScript, ESLint, Prettier)
- `pnpm run lint:tsc` - TypeScript type checking only
- `pnpm run lint:eslint` - ESLint only
- `pnpm run lint:prettier` - Prettier format checking only
- `pnpm run fix` - Auto-fix ESLint and Prettier issues
- `pnpm run fix:eslint` - Auto-fix ESLint issues only
- `pnpm run fix:prettier` - Auto-fix Prettier formatting only
- `pnpm run test` - Run tests (currently runs linting)
- `pnpm run prepack` - Build TypeScript declarations

### Code Quality Standards

- **Always run linting** before making changes: `pnpm run lint`
- **Auto-fix issues** when possible: `pnpm run fix`
- **ESLint treats warnings as errors** - all issues must be resolved
- **No TODO/FIXME comments** in code - use TODO.md file instead
- **Comments marked "Lazy"** indicate areas for potential future improvement

## Project Components

### CLI Package

**Main Entry Point**: packages/cli/src/main.ts **Description**: Command-line interface for OR-Q **Usage**: The `or-q`
command is the main entry point for the application

### Core Package

**Main File**: packages/core/src/index.ts **Description**: Provides the plugin runtime and core functionality **Key
Feature**: PluginRuntime system for loading and managing plugins

### Plugins

The system includes multiple plugins:

- **plugin-core**: Core plugin functionality
- **plugin-fetch**: HTTP request functionality with YAML configuration support
- **plugin-filesystem**: File system operations
- **plugin-format**: Formatting utilities
- **plugin-jp**: JSON processing utilities (JSONPath queries)
- **plugin-macro**: Macro functionality with parameter substitution
- **plugin-ollama**: Ollama API integration
- **plugin-openrouter-api**: OpenRouter API integration
- **plugin-shell**: Shell command execution
- **plugin-stdio-logger**: Standard I/O logging
- **plugin-store**: Data storage functionality
- **plugin-template**: Template processing
- **plugin-yaml-script**: YAML script processing with `_JSON` and `_RAW` directives

## Key Architectural Patterns

### YAML Script System

**Script Structure**:

- `requires:` array - declares plugin dependencies (validation only, not enforcement)
- `commands:` array - sequential command execution with pipeline semantics
- Scripts are assets loaded from `plugin:package-name/path` or filesystem paths

**Special Directives**:

- `_JSON:` - converts YAML objects to JSON command arguments via `loadYAMLAsJSONCommand()`
- `_RAW:` - inlines command sequences, often used for parameter substitution (`[$arg: N]`)
- `$defmacro:` - defines reusable command templates with parameter placeholders
- `$macro:` - invokes defined macros with argument substitution

### Command Pipeline Architecture

**Input/Output Contract**:

- All commands must accept `string | Readable` input and return `string | Readable` output
- Runtime validates type contracts after each command execution
- Pipeline failures generate detailed stack traces with command numbering and failure point marking

**Execution Flow**:

- Commands executed sequentially with output piped to next command's input
- `fetch` command parses input as YAML configuration using `yaml.parse()`
- `tee` command outputs to stdout while preserving pipeline flow
- `jp` command performs JSONPath queries on JSON input
- `unquote` command removes quotes from string values

### Core Runtime Design

**PluginRuntime as Command Interpreter**:

- Implements a **command pipeline interpreter** with strict type contracts (`string | Readable`)
- Uses **dynamic plugin discovery** via npm package scanning with regex-based filtering
- Employs **flat command namespace** with last-wins override semantics and process warnings
- Maintains **execution context stacks** for nested command invocation with proper cleanup

**Plugin Loading Strategy**:

- **Eager loading**: All matching plugins loaded at startup via `Promise.all()`
- **Namespace flattening**: Commands from all plugins merged into single registry
- **Asset prefixing**: Plugin assets namespaced as `plugin:package-name/path` to avoid collisions
- **Event listener aggregation**: All plugin event handlers registered on shared EventEmitter

**Command Execution Model**:

- **Sequential pipeline**: Commands executed in order with output piped to next input
- **Type enforcement**: Runtime validates `string | Readable` contract after each command
- **Error propagation**: Exceptions bubble up with detailed execution context and failure point marking
- **Argument consumption**: Commands mutate args array via `args.shift()` pattern

### Advanced Plugin Patterns

**Stateful Plugin Architecture** (stdio-logger):

- Plugin instances maintain private state (`logLevelOrd`) across command invocations
- Event-driven side effects via synchronous EventEmitter listeners
- Class-based plugins for complex state management vs simple object exports

**Context-Based Communication** (plugin-store, plugin-macro):

- **Stack-based contexts**: `pushContext/popContext` for nested execution scopes
- **Namespaced context IDs**: `context:${pkg.name}:${feature}` prevents collisions
- **Type-safe context retrieval**: Generic `getContext<T>()` with undefined fallback
- **Automatic cleanup**: Context popped in finally blocks for exception safety

**Asset Resolution Hierarchy**:

- **URI scheme dispatch**: `plugin:`, `file:///`, relative paths handled differently
- **Glob-based discovery**: `assetGlob()` for pattern matching across plugin assets
- **Fallback chain**: Direct URI → plugin glob search → filesystem resolution
- **Multiple match handling**: Warnings for ambiguous matches, first-wins selection

### Stream Processing Architecture

**Hybrid String/Stream Model**:

- Commands must handle both `string` and Node.js `Readable` inputs
- `readableToString()` utility for stream-to-string conversion when needed
- `Readable.fromWeb()` for web stream integration (OpenRouter API)
- Type validation enforced at runtime boundaries, not compile time

**I/O Command Patterns**:

- **Input transformation**: `echo`, `clear`, `default` for input manipulation
- **Side-effect commands**: `print`, `tee` for stdout output while preserving pipeline
- **Stream sources**: `-` command for stdin injection, `readline` for interactive input
- **Pass-through semantics**: Many commands forward input unchanged while performing side effects

### YAML Script Compilation

**AST-to-Command Translation**:

- **Recursive descent parser**: `loadCommandsImpl()` handles nested YAML structures
- **Command normalization**: Strings, arrays, objects all converted to `Arguments` arrays
- **Special directive handling**: `_JSON`, `_DATA`, `_RAW` for meta-programming
- **Macro expansion**: Template substitution with parameter binding via context system

**Script Execution Model**:

- **Asset-first resolution**: Scripts loaded from plugin assets before filesystem
- **Dependency declaration**: `requires` array for plugin validation (not enforcement)
- **Conditional execution**: `on-empty-stdin` for input-dependent behavior
- **Error context preservation**: YAML parsing errors include source location info

### HTTP Request Pattern

**Fetch Command Integration**:

- `_JSON` directive creates structured request configuration
- `fetch` command accepts URL as argument and request config as input
- Response body returned as `Readable` stream via `Readable.fromWeb()`
- Error responses (HTTP errors, malformed JSON) passed through pipeline unchanged

**Common API Integration Pattern**:

```yaml
- _JSON:
    method: POST
    headers:
      Content-Type: application/json
    body:
      model: { _RAW: [$arg: 2] }
      messages: [...]
- fetch: [[$arg: 1]] # URL
- jp: 'choices[0].message.content' # Extract response
```

### Error Handling Strategy

**Structured Exception Hierarchy**:

- `PluginRuntimeFailure` for expected failures (user errors, missing resources)
- `PluginError` base class for plugin-specific exceptions
- `fail()` helper for consistent error throwing with message formatting

**Execution Context Reporting**:

- **Command stack traces**: Numbered list of executed commands with failure point marking
- **Argument truncation**: Long arguments ellipsized for readable error output
- **Multi-level logging**: spam/debug/info/log/warn/error with configurable filtering
- **Synchronous error emission**: Immediate logging via EventEmitter for debugging

**Error Response Processing**:

- API error responses are valid JSON but contain `error` objects instead of expected data
- Pipeline continues processing error responses as if they were successful
- JSONPath queries on error responses return `null`, causing downstream command failures
- Error detection requires checking response structure before processing

**Command Failure Patterns**:

- `unquote` command fails with "input is null" when JSONPath returns no matches
- `runCommands: internal error, invalid resulting input type; object` indicates type contract violation
- Detailed error traces show command sequence with failure point marked by `> command <`

**Debugging Techniques**:

- Use `tee` command to inspect intermediate pipeline values
- Check API responses directly with curl to verify expected vs actual response format
- Examine command argument parsing with spam-level logging events
- Validate `_JSON` directive output by testing individual components

### Plugin Development Patterns

**Command Implementation Contracts**:

- **Async signature**: `(input, args, runtime) => Promise<string | Readable>`
- **Argument validation**: Use `commandArgument()` for type-safe parameter extraction
- **Error handling**: Throw `PluginRuntimeFailure` via `fail()` for user-facing errors
- **Side effect management**: Emit logging events for debugging, use stdout for user output

**Plugin Composition Strategies**:

- **Modular commands**: Split functionality across multiple files, merge with `mergeCommands()`
- **Asset bundling**: Use `loadModuleAssets()` for automatic asset discovery
- **Event-driven integration**: Register listeners for cross-plugin communication
- **Context sharing**: Use namespaced context IDs for plugin-specific state management

## Fundamental Architectural Constraints

### Why Optional Arguments Are Impossible

The OR-Q pipeline architecture has a fundamental constraint that makes optional arguments impossible in the current
design. This is not a limitation but an intentional architectural decision that emerges from the pipeline execution
model.

#### The Sequential Consumption Model

**Pipeline Execution Flow**:

```typescript
// In PluginRuntime.runCommands()
const args = program.slice();
while (args.length > 0) {
  const command = await commandArgument(this, args.shift(), 'Internal error: unreachable');
  // Execute command with remaining args
  input = await this.commands[command].run(input, args, this);
}
```

**Key Insight**: The runtime consumes the first element as a command name, then passes the **entire remaining args
array** to that command. The command is responsible for consuming its own arguments via `args.shift()`.

#### The args.shift() Pattern

**Universal Argument Consumption**:

```typescript
// Every command follows this pattern:
const myArg = await commandArgument(runtime, args.shift(), 'usage: command "<required-arg>"');
```

**Critical Properties**:

1. **Destructive consumption**: `args.shift()` mutates the array, removing the consumed argument
2. **Sequential processing**: Arguments are consumed in strict left-to-right order
3. **No lookahead**: Commands cannot inspect upcoming arguments without consuming them
4. **No backtracking**: Once consumed, arguments cannot be "put back"

#### The Impossibility Proof

**Why Optional Arguments Cannot Work (Generally)**:

1. **No argument count negotiation**: Commands cannot know how many arguments they should consume
2. **No argument type inspection**: Commands cannot peek at argument types without consuming them
3. **No command-to-command communication**: Each command runs in isolation with no knowledge of subsequent commands
4. **Greedy consumption problem**: If a command has optional arguments, it cannot know whether to consume the next
   argument or leave it for the next command

**Example of the Problem**:

```bash
# Hypothetical command with optional argument:
or-q command-with-optional-arg [optional] next-command required-arg

# The pipeline cannot determine:
# - Should "next-command" be consumed as the optional argument?
# - Or should it be left as the next command in the pipeline?
# - There's no way to distinguish without complex lookahead parsing
```

#### The Command Name Collision Workaround

**Limited Optional Arguments Are Possible**:

There is one exception to the impossibility of optional arguments: **command name collision detection**. A command can
peek at `args[0]` without consuming it and check if it matches a known command name:

```typescript
// Pseudo-optional argument pattern:
let topic: string | undefined;
if (args.length > 0 && !(args[0] in runtime.commands)) {
  // args[0] is not a command, so it's safe to consume as our optional argument
  topic = await commandArgument(runtime, args.shift(), 'usage: help [topic]');
}
// If args[0] IS a command, we leave it alone for the next command in the pipeline
```

**Constraints of This Workaround**:

1. **Optional arguments cannot match command names**: The argument value space is constrained by the global command
   namespace
2. **Namespace dependency**: The behavior depends on which plugins are loaded and their command names
3. **Collision risk**: Adding new plugins with conflicting command names can break existing optional arguments
4. **Limited to string arguments**: Only works for simple string arguments, not complex nested structures

**Use Cases Where This Works**:

- `help [command-name]` - command names are known and controlled
- `log [level]` where levels don't conflict with commands
- `format [type]` where format types are distinct from command names

**Use Cases Where This Fails**:

- Generic string arguments that might accidentally match command names
- Numeric arguments (if commands can have numeric names)
- Complex arguments that require parsing

#### The Arguments Type Structure

**Recursive Definition**:

```typescript
export type Arguments = (string | Arguments)[];
```

**Nested Command Execution**:

- Arguments can contain nested command arrays: `['command', ['nested', 'commands'], 'more-args']`
- The `commandArgument()` helper can execute nested commands: `await runtime.runCommands(input, arg)`
- This enables dynamic argument generation but maintains the sequential consumption model

#### Architectural Implications

**Design Consequences**:

1. **Most arguments must be required**: Commands must fail if required arguments are missing
2. **Fixed arity commands**: Each command has a predetermined number of arguments (with collision detection exception)
3. **No variadic arguments**: Commands cannot accept variable numbers of arguments
4. **No flag-style arguments**: No `-f` or `--flag` style optional parameters
5. **No argument parsing libraries**: Standard CLI argument parsing patterns don't apply
6. **Command namespace constraints**: Optional arguments are constrained by the global command namespace

**Workarounds Within the System**:

1. **Command name collision detection**: Limited optional arguments possible via `!(args[0] in runtime.commands)`
2. **Multiple command variants**: `glob` vs `glob-advanced` for different argument patterns
3. **Default value commands**: Use `default` command to provide fallback values
4. **Conditional execution**: Use YAML scripts with `on-empty-stdin` for conditional behavior
5. **Context-based configuration**: Store optional parameters in the context system

#### The Planned Solution

**From TODO.md Architectural Debt**:

> Design and implement proper CS-rigorous raw program form, for nestable command/argument chains... First class
> arguments, invocation form is always the (command, arguments) tuple explicitly (in data)... Arguments are schema-typed
> with arktype.

**Future Architecture**:

- **Explicit argument schemas**: Each command declares its argument structure
- **Compile-time validation**: Argument validation before execution
- **Structured argument passing**: Arguments as typed data structures, not sequential arrays
- **Optional argument support**: Schema-driven optional parameter handling

#### Current State Assessment

**Why This Constraint Exists**:

- **Rapid prototyping phase**: The current system prioritizes simplicity over flexibility
- **Pipeline semantics**: The Unix pipe model doesn't naturally support optional arguments
- **Type safety trade-offs**: The current system trades argument flexibility for runtime type safety

**Development Implications**:

- **Command design**: All commands must be designed with fixed, required arguments
- **User experience**: Users must provide all arguments or use workaround patterns
- **Plugin development**: Plugin authors cannot use familiar CLI argument patterns

This constraint is fundamental to the current architecture and cannot be worked around without the planned architectural
overhaul described in the TODO.md file.

## Strategic Architecture Direction

### Core Language Evolution

**Toward Formal Program Representation**:

- Current CLI/YAML are **external DSLs** that compile to internal command chains
- **Planned**: CS-rigorous raw program form with first-class arguments and nestable command/argument chains
- **Vision**: DAG-like program representation with (command, arguments) tuples as primitives
- **Goal**: Support raw form as JavaScript arrays for programmatic construction

**Multi-Language Runtime Targets**:

- **Lua Integration**: Planned Fengari binding with coroutines and branching support
- **JavaScript Runtime**: TypeScript codegen for plugin commands and type safety
- **Codegen Strategy**: Auto-generate language bindings from plugin metadata

### Testing and Quality Infrastructure

**Declarative Testing Framework**:

- **Black-box tests**: YAML-based test specifications per plugin
- **Test format**: `packages/**/tests/**/*.yaml` with env, args, stdin, stdout, stderr
- **Commands**: `test-plugin` and `test-all-plugins` for comprehensive validation
- **Philosophy**: End-to-end behavior validation over unit testing

**Enhanced Error Handling**:

- **Planned**: Move `fail()` to `IPluginRuntime.abort()` with dedicated fail log level
- **Logging refactor**: CLI logger for stderr/stdout separation, file logger for optional persistence
- **Stack trace improvement**: Log JavaScript stack traces nicely instead of rethrowing
- **Schema validation**: Proper schemas for command arguments and script formats

### Plugin Ecosystem Maturation

**API Standardization**:

- **OpenRouter/OpenAI split**: Separate plugins for different API providers
- **Endpoint expansion**: More OpenRouter API endpoints beyond completions
- **Naming conventions**: Provider-specific command prefixes (openrouter-_, openai-_)

**Advanced Runtime Features**:

- **MCP Server**: Model Context Protocol server implementation alongside CLI
- **Visual Editor**: No/low-code editor for command pipeline construction
- **Bi-system**: Mysterious planned feature (bidirectional communication?)
- **Data passing optimization**: YAML/JSON object passing to reduce serialization overhead
- **Schema enforcement**: Structured validation for commands and scripts

### Development Workflow Improvements

**Code Quality Evolution**:

- **Console.\* prohibition**: Force logging events instead of direct console usage
- **Lazy comment cleanup**: Systematic removal of technical debt markers
- **Package metadata**: Comprehensive descriptions, keywords, and metadata
- **Repository tooling**: Description generation scripts and decision tracking

**Dependency Management**:

- **installed-node-modules extraction**: Standalone npm package for plugin discovery
- **Modern JavaScript**: Replace JSON.parse/stringify with structuredClone()
- **HTTP resilience**: Exponential backoff for 429 and other HTTP errors

### Architectural Implications

**Current State Assessment**:

- The system is in **rapid prototyping phase** with many "Lazy" implementations
- **Plugin architecture is stable** but runtime internals are evolving
- **External interfaces** (CLI, YAML) are considered temporary facades
- **Core abstractions** (command pipelines, contexts) are foundational

**Development Strategy**:

- **Backward compatibility** not guaranteed during this phase
- **Plugin API stability** prioritized over internal implementation
- **Incremental formalization** of ad-hoc patterns into proper abstractions
- **Multi-target compilation** as long-term architectural goal

This roadmap suggests OR-Q is evolving from a **specialized OpenRouter CLI** into a **general-purpose command pipeline
runtime** with multiple language targets, formal program representation, and **visual programming capabilities** -
essentially becoming a **universal AI workflow orchestration platform**.

## Code Conventions

### TypeScript Standards

- **Target**: ES2022 with ESNext modules
- **Module Resolution**: "bundler" with path mapping for `@or-q/*` packages
- **Strict Mode**: Enabled with comprehensive type checking
- **Declarations**: Generated to `dist/` directory
- **Imports**: Use `with { type: 'json' }` for package.json imports

### File Structure Patterns

- **Source Code**: Each package has `src/` directory with TypeScript source
- **Assets**: YAML scripts in `assets/` subdirectories
- **Plugin Index**: Import and merge sub-modules using `mergeCommands()`
- **Testing**: Planned YAML files in `packages/**/tests/**/*.yaml` format

### ESLint Configuration

- Based on recommended TypeScript ESLint config
- Enforces consistent type imports
- Comprehensive unused variable detection with underscore prefix ignore
- Prohibits TODO/FIXME comments (use TODO.md instead)

## Development Patterns

### Command Implementation

**Standard Structure**:

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

- Use `commandArgument(runtime, args.shift(), usage)` for validation
- Arguments consumed via `args.shift()` - modifies array in place
- Provide clear usage patterns for error messages

**Input/Output Handling**:

- Input: `string | Readable` stream
- Use `readableToString(input)` when string conversion needed
- Return: `string | Readable` (enforced by runtime validation)
- Stream processing via Node.js Readable API

### Error Handling

- Throw `PluginRuntimeFailure` via `fail(message)` function
- CLI catches and outputs to stderr
- Detailed stack traces with command list and failure point marking
- Uncaught exceptions logged via `console.error`

### Asset Resolution

- Supports `plugin:`, `file:///`, and relative path schemes
- Plugin asset search via `assetGlob(runtime, 'plugin:*/**/scripts/**/${uri}.yaml')`
- Priority: 1) Direct URI, 2) Plugin glob search, 3) Filesystem
- Multiple matches generate warnings, uses first match

## Logging and Output Architecture

### Event-Driven Logging

- Plugins emit structured events via `runtime.emit(loggingEventName, event)`
- Events contain `source`, `level` (spam/debug/info/log/warn/error/none), `value`
- Multiple plugins can listen simultaneously
- Event processing is synchronous

### stdio-logger Behavior

- Filters by configurable log level (`logLevelOrd`)
- Immediate output to `process.stdout` via `Console.log`
- Tab-separated format: `${level}\t${plugin-name}\t${message}`
- No buffering or deferral

### Output Timing

- Event logs appear immediately (synchronous)
- CLI result output after command completion (post-async)
- No coordination between logging and result streams

## Testing Strategy

### Planned Testing Approach

- Declarative black-box tests using YAML files
- Format: `packages/**/tests/**/*.yaml`
- Specify: environment, arguments, stdin, expected stdout/stderr
- Focus on end-to-end behavior validation

### CLI Testing Modes

- Single command: `pnpm or-q command arg1 arg2`
- Pipeline: `echo input | pnpm or-q command | pnpm or-q another`
- Script execution: `pnpm or-q run script-name`

## Development Best Practices

### When Making Changes

1. **Understand the plugin system** - Know which plugin handles what functionality
2. **Follow command patterns** - Use established argument processing and I/O handling
3. **Maintain type safety** - Leverage TypeScript's strict mode fully
4. **Test command chains** - Ensure proper input/output piping
5. **Check asset resolution** - Verify plugin: URIs and file paths work correctly
6. **Run full linting** - Use `pnpm run lint` before committing
7. **Document in TODO.md** - Never use TODO comments in code

### Plugin Development

- Export default object conforming to `Plugin` interface
- Use `mergeCommands()` for combining command sets
- Implement proper error handling with `fail()` function
- Support both string and Readable input types
- Emit structured logging events when appropriate
- Test asset loading and URI resolution

### Debugging Tips

- Use `debug` command for runtime inspection
- Check plugin loading with `plugins` command
- Verify asset resolution with `assets` command
- Monitor event flow through logging system
- Test command chains with various input types
- **To find a script for `run foo` command**: Search repository files for `foo.yaml`

### fetch-test Script Analysis

**Script Location**: `/packages/plugin-fetch/assets/scripts/fetch-test.yaml`

**Script Flow**:

1. Calls `run: fetch-openai-instruct` to define a macro
2. Invokes `$macro` with `$fetch-openai-instruct` and parameters:
   - URL: `http://localhost:11434/v1/chat/completions` (Ollama endpoint)
   - Model: `gpt-oss:20b`
   - System message: "Reasoning: low\n\nYou speak only in Pirate"
   - User message: "Who are you?"

**fetch-openai-instruct Macro** (`/packages/plugin-fetch/assets/scripts/fetch-openai-instruct.yaml`):

1. `_JSON` - Creates JSON request body with OpenAI chat completion format
2. `fetch` - Makes HTTP POST request to the URL
3. `tee` - Outputs response to stdout while preserving pipeline
4. `jp` - Extracts `choices[0].message.content` from JSON response using JSONPath
5. `unquote` - Removes JSON quotes from the extracted content

**Command Implementations**:

- **`run`** (`plugin-yaml-script/src/index.ts:279`): Loads and executes YAML scripts from plugin assets or filesystem,
  with asset resolution hierarchy
- **`$defmacro`** (`plugin-macro/src/index.ts:23`): Stores macro definitions in global registry, forwards input
  unchanged
- **`$macro`** (`plugin-macro/src/index.ts:43`): Invokes stored macros with argument substitution via context system
- **`$arg`** (`plugin-macro/src/index.ts:72`): Macro argument placeholder that resolves to macro invocation arguments by
  index
- **`_JSON`** (`plugin-yaml-script/src/index.ts:331`): **Special directive** - converts YAML objects to JSON via
  `loadInputFromJSONCommand()` during script compilation
- **`fetch`** (`plugin-fetch/src/fetch.ts:19`): Makes HTTP requests using `fetch()` API, parses input as YAML config,
  returns response body as `Readable` stream
- **`tee`** (`plugin-core/src/io.ts:22`): Outputs trimmed input to stdout, passes untrimmed input forward in pipeline
- **`jp`** (`plugin-jp/src/index.ts:10`): Runs external `jp` command (JMESPath) for JSONPath queries on input
- **`unquote`** (`plugin-core/src/string.ts:5`): Parses input as JSON string using `JSON.parse()` to remove quotes

**Script Loading Mechanism**:

1. **Asset Resolution** (`run` command):
   - Direct URI resolution via `resolveAsset(runtime, uri)`
   - Plugin glob search: `plugin:*/**/scripts/**/${uri}.yaml`
   - Filesystem fallback for qualified paths (./file.yaml, /abs/path.yaml)
   - Multiple matches generate warnings, first match wins

2. **YAML Parsing** (`runYAMLScript`):
   - Parse YAML into `Script` object with `requires` and `commands` properties
   - Validate required plugin dependencies via `runtime.plugins[name]`
   - Handle `on-empty-stdin` conditional execution
   - Convert to command arguments via `loadCommands()`

3. **Command Compilation** (`loadCommands` → `loadCommandsImpl`):
   - **Strings/Numbers**: Push directly as command arguments
   - **Arrays**: Create nested command sequences
   - **Objects**: Process key-value pairs as command-argument pairs
   - **Special Directives**: Handle `_JSON` and `_DATA` during compilation

4. **`_JSON` Special Processing**:
   - **Compilation Phase**: `loadYAMLAsJSONCommand()` converts YAML objects to argument streams
   - **Execution Phase**: `loadInputFromJSONCommand()` reconstructs JSON from argument streams
   - **Stream Format**: `['object', 'key1', 'string', 'value1', 'key2', 'number', '42', 'end-object']`
   - **`_RAW` Handling**: Inlines command sequences during compilation for parameter substitution

5. **Macro System**:
   - **Definition**: `$defmacro` stores command templates in global registry
   - **Invocation**: `$macro` creates execution context with arguments
   - **Parameter Substitution**: `$arg N` resolves to Nth macro argument via context system
   - **Context Management**: Stack-based contexts with automatic cleanup

**Error Analysis**: The error shows the API returned an error response:
`{"error":{"message":"invalid character 'o' looking for beginning of value",...}}`. The `jp` command extracted
`choices[0].message.content` which returned `null` (since the response has `error` instead of `choices`), causing
`unquote` to fail with "input is null" when trying to `JSON.parse(null)`.

## Module System

- Uses ES Modules (ESM)
- TypeScript with declaration files
- Module resolution: "bundler"
