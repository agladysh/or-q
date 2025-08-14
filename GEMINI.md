# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Project Overview

OR-Q is a plugin-based CLI tool for orchestrating command pipelines, with a focus on interacting with AI models and
services like OpenRouter and Ollama. It is built with TypeScript and Node.js and features a modular plugin system where
each plugin provides commands and assets.

The core of OR-Q is a command pipeline where each command receives an input (either a string or a Readable stream) and
produces an output of the same type. This allows for chaining commands together to perform complex data transformations.

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

### Package Management

- Uses `pnpm` with workspaces defined in `pnpm-workspace.yaml`
- All packages are in `packages/*` directories
- Uses `workspace:*` for internal package dependencies

## Architecture

### Core Components

**Main Entry Point (`packages/cli/src/main.ts`)**

- The CLI entry point for the application.
- It initializes the `PluginRuntime` and executes the command pipeline based on the command-line arguments.

**Plugin Runtime (`packages/core/src/index.ts`)**

- The heart of the application, responsible for loading and managing plugins, and executing the command pipeline.
- It discovers plugins in `node_modules` that match the pattern `@or-q/plugin-*` or `or-q-plugin*`.
- It provides a context system for plugins to share data and an event system for inter-plugin communication.

### Plugin System

Plugins are the primary way to extend the functionality of OR-Q. Each plugin is a Node.js package that exports a default
object with the following properties:

- `name`: The name of the plugin, which should match the `name` field in its `package.json`.
- `commands`: An object where keys are command names and values are command implementations.
- `assets`: An object where keys are asset names and values are the asset content (typically YAML scripts).
- `eventListeners`: An object where keys are event names and values are event listener functions.

### Command Pipeline

The command pipeline is the core execution model in OR-Q. It is a sequence of commands where the output of one command
is the input to the next.

- **Input/Output:** Each command receives two arguments: `input` (either a `string` or a `Readable` stream) and `args`
  (an array of arguments). It must return a `Promise` that resolves to either a `string` or a `Readable` stream.
- **Type Contract:** The `PluginRuntime` enforces a strict type contract: all commands must return a `string` or a
  `Readable` stream. If a command returns any other type, the pipeline will fail.

### YAML Script System

OR-Q supports a powerful YAML-based scripting system that allows you to define and execute complex command pipelines.

- **`run` command:** The `run` command in the `plugin-yaml-script` plugin is used to execute YAML scripts.
- **`requires` keyword:** YAML scripts can specify a `requires` keyword to declare dependencies on other plugins.
- **`on-empty-stdin` keyword:** Scripts can use the `on-empty-stdin` keyword to execute a different set of commands when
  the input is empty.
- **`_JSON` directive:** This directive allows you to embed JSON objects directly in your YAML scripts. The
  `plugin-yaml-script` will serialize the object to a JSON string before passing it to the command.
- **`_RAW` directive:** This directive allows you to inline a sequence of commands within another command's arguments.

### Context System

The context system allows plugins to share data with each other. It is a simple key-value store that is managed by the
`PluginRuntime`.

- **`pushContext`, `popContext`, `getContext`:** The `PluginRuntime` provides three methods for interacting with the
  context: `pushContext`, `popContext`, and `getContext`.
- **`plugin-store`:** The `plugin-store` provides a simple key-value store that is built on top of the context system.
- **`plugin-macro`:** The `plugin-macro` uses the context system to manage macro definitions and expansions.

### Event System

The event system allows plugins to communicate with each other in a loosely coupled way. It is based on the Node.js
`EventEmitter`.

- **`emit`:** The `PluginRuntime` provides an `emit` method that allows plugins to emit events.
- **`eventListeners`:** Plugins can define an `eventListeners` object in their plugin definition to listen for events.

### Asset Resolution

The asset resolution system allows plugins to bundle and access assets, such as YAML scripts.

- **`plugin:` protocol:** Assets are accessed using a `plugin:` protocol, followed by the plugin name and the asset path
  (e.g., `plugin:@or-q/plugin-openrouter-api/scripts/chat.yaml`).
- **`assetGlob`:** The `assetGlob` function in `@or-q/lib` can be used to find assets that match a glob pattern.
- **`resolveAsset`:** The `resolveAsset` function in `@or-q/lib` can be used to resolve an asset URI to its content.

## Code Conventions

### TypeScript Configuration

- **Target:** ES2022
- **Module System:** ESNext
- **Strict Mode:** Enabled

### ESLint Configuration

- Based on the recommended TypeScript ESLint config.
- Warnings are treated as errors.
- `TODO`/`FIXME` comments are prohibited. Use the `TODO.md` file instead.

### "Lazy" Comments

The codebase contains many comments that start with "Lazy." These comments indicate areas where the implementation is
not yet complete or could be improved. They are a good place to start if you are looking for ways to contribute to the
project.

## Getting Started

### Creating a New Plugin

1. **Create a new directory** in the `packages/` directory (e.g., `packages/plugin-my-plugin`).
2. **Create a `package.json` file** in the new directory. Make sure the `name` field follows the pattern
   `@or-q/plugin-my-plugin`.
3. **Create a `src/index.ts` file** in the new directory. This will be the main entry point for your plugin.
4. **Export a default object** from `src/index.ts` that conforms to the `Plugin` interface.

### Creating a New Command

1. **Add a new entry** to the `commands` object in your plugin's `index.ts` file.
2. **The key** should be the name of the command.
3. **The value** should be an object with a `description` and a `run` method.
4. **The `run` method** should be an `async` function that takes `input`, `args`, and `runtime` as arguments and returns
   a `Promise` that resolves to a `string` or a `Readable` stream.

### Core Utilities

- **`commandArgument`**: This function is the standard way to process command arguments. It takes the runtime, the
  argument itself, and a usage string as input. If the argument is a nested command, it will be executed and its output
  will be returned as a string. If the argument is undefined, it will throw a `PluginRuntimeFailure` with the provided
  usage string.
- **`spawnText`**: This function is used to execute external commands. It takes the command to execute, the input to the
  command, and a set of options as input. It returns a `Promise` that resolves to the standard output of the command.
- **`PluginRuntimeFailure`**: This is the standard exception to throw when a command fails. It takes a message as input,
  which will be displayed to the user.
- **`readableToString`**: This utility function is used to convert a `Readable` stream to a string. This is useful when
  a command needs to process the entire input as a string.
- **`loadModuleAssets`**: This function is used by plugins to load their assets. It takes the `import.meta.url` of the
  module and returns an object where the keys are the asset names and the values are the asset content.

## Future Directions

- **Declarative Testing Framework**: The project plans to implement a declarative black-box testing framework using YAML
  files.
- **Improved Error Handling**: The error handling will be improved with more structured exceptions and better stack
  traces.
- **First-class Arguments**: The argument parsing system will be redesigned to support typed, first-class arguments,
  which will enable features like optional arguments and better validation.
- **Data-object passing**: The system will support passing JSON-like data objects as input to save on
  serialization/deserialization overhead.

## Known Limitations

- **Error Handling for Fetch**: The current implementation does not handle fetch errors gracefully. This can lead to
  unexpected failures when interacting with external APIs.
- **No Optional Arguments**: The current architecture does not support optional arguments for commands.
