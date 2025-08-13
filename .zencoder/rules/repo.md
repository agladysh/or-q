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
- **plugin-filesystem**: File system operations
- **plugin-format**: Formatting utilities
- **plugin-jp**: JSON processing utilities
- **plugin-macro**: Macro functionality
- **plugin-openrouter-api**: OpenRouter API integration
- **plugin-shell**: Shell command execution
- **plugin-stdio-logger**: Standard I/O logging
- **plugin-store**: Data storage functionality
- **plugin-template**: Template processing
- **plugin-yaml-script**: YAML script processing

## Module System

- Uses ES Modules (ESM)
- TypeScript with declaration files
- Module resolution: "bundler"
