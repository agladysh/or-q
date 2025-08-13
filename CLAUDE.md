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

OR-Q is a plugin-based CLI tool for OpenRouter API interactions built with TypeScript and Node.js. The architecture follows a modular plugin system where each plugin provides commands and assets.

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

**Plugin Structure**
Each plugin exports a default object with:

- `name`: Package name from package.json
- `commands`: Object mapping command names to Command implementations
- `assets`: Optional assets loaded from `../assets` directory (typically YAML scripts)
- `eventListeners`: Optional event handlers for runtime events

**Key Plugins**

- `plugin-core`: Essential commands (assets, debug, formats, input, io, log, plugins, string)
- `plugin-openrouter-api`: OpenRouter API integration (completions, conversation, models)
- `plugin-yaml-script`: YAML-based scripting system with `run`, `exec`, `fail`, `forever` commands
- `plugin-shell`, `plugin-store`, `plugin-filesystem`: System integration
- `plugin-macro`: Macro functionality
- `plugin-template`, `plugin-format`, `plugin-jp`: Data processing utilities

**YAML Script System (`packages/plugin-yaml-script/`)**

- Declarative command execution using YAML files
- Scripts can specify `requires` for plugin dependencies
- Support for `on-empty-stdin` conditional execution
- Asset system allows bundled scripts accessible via `plugin:` URIs
- Commands can be strings, arrays, or objects with nested structure

### Code Conventions

**TypeScript Configuration**

- Uses modern ES2022 target with ESNext modules
- Bundler module resolution with path mapping for `@or-q/*` packages
- Strict mode enabled with comprehensive type checking
- Declaration files generated to `dist/` directory

**ESLint Configuration**

- Based on recommended TypeScript ESLint config
- Treats warnings as errors
- Prohibits TODO/FIXME comments in code (use TODO.md instead)
- Enforces consistent type imports
- Comprehensive unused variable detection with underscore prefix ignore pattern

**File Structure Patterns**

- Each package has `src/` directory with TypeScript source
- Assets (YAML scripts) in `assets/` subdirectories
- Plugin index files import and merge sub-modules using `mergeCommands()`
- Package.json imports use `with { type: 'json' }` syntax

**Development Notes**

- Comments marked with "Lazy" indicate areas needing improvement
- Command-line tools should use `commandArgument()` helper for parameter validation
- Asset resolution supports `plugin:`, `file:///`, and relative path schemes
- Logging system uses structured events with configurable levels (spam, debug, info, log, warn, error, none)
- Context management allows plugins to share state during command execution

### Testing Strategy

The project plans to implement declarative black-box tests using YAML files in `packages/**/tests/**/*.yaml` format, specifying environment, arguments, stdin, and expected stdout/stderr.
