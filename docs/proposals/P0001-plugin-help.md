# P0001: Help Plugin Implementation

**Status**: Draft **Author**: System Analysis **Date**: 2025-01-27 **Priority**: First Priority (per TODO.md)

## Summary

This proposal outlines the implementation of a comprehensive help system for OR-Q through a dedicated
`@or-q/plugin-help` package. The design addresses the architectural constraints of the OR-Q pipeline system while
providing intuitive help functionality for users.

## Background

### Current State

OR-Q currently lacks a comprehensive help system. The CLI falls back to a "Lazy" `runtime.usage()` method that simply
lists available commands. Users have no way to:

- Get detailed help for specific commands
- Understand plugin functionality
- Discover available YAML scripts
- Access comprehensive system documentation

### Architectural Discovery

During analysis, we discovered a fundamental constraint in OR-Q's pipeline architecture: **optional arguments are
generally impossible** due to the sequential consumption model where commands use `args.shift()` to consume arguments
destructively.

However, we identified a limited workaround: **command name collision detection**. Commands can peek at `args[0]` and
check `!(args[0] in runtime.commands)` to implement pseudo-optional arguments, but this only works when the optional
argument values don't conflict with command names.

For help commands like `help <command-name>`, this workaround fails because the argument IS a valid command name, making
collision detection ineffective.

## Design Principles

### 1. Explicit Command Structure

Instead of fighting the architectural constraints, we embrace them by creating explicit, discoverable command names:

- `help-command <command-name>` - Help for specific commands
- `help-plugin <plugin-name>` - Help for specific plugins
- `help-script <script-name>` - Help for specific scripts (from yaml-script plugin)
- `help-commands` - List all commands
- `help-plugins` - List all plugins
- `help-scripts` - List all scripts (from yaml-script plugin)

### 2. Separation of Concerns

- **Human-readable help**: `help-*` commands provide formatted, user-friendly output
- **Machine-readable data**: `show-*` commands provide structured data for programmatic use
- **Plugin-specific help**: Each plugin can contribute help content for its own commands

### 3. CLI Integration

When OR-Q is invoked with no arguments:

1. Check if `help` command exists in the runtime
2. If yes, execute it and display the output
3. If no, show a generic fallback message recommending `@or-q/plugin-help`

## Detailed Design

### Core Help Commands

#### `help`

**Description**: Shows comprehensive system overview **Arguments**: None **Output**:

- OR-Q version and description
- Quick start guide
- Available help commands
- Installation instructions for additional plugins

#### `help-command <command-name>`

**Description**: Shows detailed help for a specific command **Arguments**:

- `command-name` (required): Name of the command to get help for **Output**:
- Command description
- Usage syntax
- Examples (if available)
- Plugin source
- Related commands

#### `help-plugin <plugin-name>`

**Description**: Shows detailed help for a specific plugin **Arguments**:

- `plugin-name` (required): Name of the plugin to get help for **Output**:
- Plugin description and version
- All commands provided by the plugin
- Available assets
- Installation/configuration notes

#### `help-script <script-name>`

**Description**: Shows help for a specific YAML script (provided by yaml-script plugin) **Arguments**:

- `script-name` (required): Name of the script to get help for **Output**:
- Script description (from YAML metadata)
- Required plugins
- Usage examples
- Parameter documentation

### List Commands

#### `help-commands`

**Description**: Lists all available commands grouped by plugin **Arguments**: None **Output**: Formatted list of all
commands with brief descriptions

#### `help-plugins`

**Description**: Lists all installed plugins **Arguments**: None **Output**: List of plugins with versions and brief
descriptions

#### `help-scripts`

**Description**: Lists all available YAML scripts (provided by yaml-script plugin) **Arguments**: None **Output**: List
of scripts with brief descriptions

### Machine-Readable Commands

#### `show-commands`

**Description**: Outputs command data in JSON format **Arguments**: None **Output**: JSON structure with complete
command metadata

#### `show-plugins`

**Description**: Outputs plugin data in JSON format **Arguments**: None **Output**: JSON structure with complete plugin
metadata

#### `show-scripts`

**Description**: Outputs script data in JSON format (provided by yaml-script plugin) **Arguments**: None **Output**:
JSON structure with complete script metadata

## Implementation Plan

### Phase 1: Core Help Plugin

1. **Create `@or-q/plugin-help` package**
   - Basic package structure with TypeScript setup
   - Core help commands implementation
   - Integration with existing plugin system

2. **Implement basic help commands**
   - `help` - comprehensive overview
   - `help-command` - individual command help
   - `help-commands` - command listing

3. **CLI integration**
   - Modify `packages/cli/src/main.ts` to check for help command
   - Remove `runtime.usage()` method from core
   - Add fallback message for missing help plugin

### Phase 2: Plugin Integration

1. **Plugin-specific help**
   - `help-plugin` command implementation
   - `help-plugins` listing command
   - Integration with plugin metadata

2. **Machine-readable commands**
   - `show-commands` JSON output
   - `show-plugins` JSON output
   - Replace existing `list-*` commands

### Phase 3: Script Integration

1. **YAML script help** (implemented in yaml-script plugin)
   - `help-script` command implementation
   - `help-scripts` listing command
   - `show-scripts` JSON output
   - Script metadata parsing from YAML files

### Phase 4: Command Cleanup

1. **Triage existing commands**
   - `list-plugins` → `show-plugins`
   - `list-assets` → `show-assets`
   - Remove redundant `*-json` commands
   - Update documentation

## Technical Implementation Details

### Plugin Structure

```typescript
// packages/plugin-help/src/index.ts
import { Plugin, Commands } from '@or-q/lib';
import pkg from '../package.json' with { type: 'json' };

const commands: Commands = {
  help: {
    description: 'shows comprehensive OR-Q help and usage information',
    run: async (input, args, runtime) => {
      return generateComprehensiveHelp(runtime);
    },
  },

  'help-command': {
    description: 'shows detailed help for a specific command',
    run: async (input, args, runtime) => {
      const commandName = await commandArgument(runtime, args.shift(), 'usage: help-command "<command-name>"');
      return generateCommandHelp(runtime, commandName);
    },
  },

  // ... other commands
};

const plugin: Plugin = {
  name: pkg.name,
  commands,
};

export default plugin;
```

### CLI Integration

```typescript
// packages/cli/src/main.ts - modification
if (args.length === 0) {
  if ('help' in runtime.commands) {
    const helpOutput = await runtime.runCommands('', ['help']);
    process.stdout.write(await readableToString(helpOutput));
  } else {
    process.stdout.write('OR-Q (OpenRouter Query) - Plugin-based CLI tool\n\n');
    process.stdout.write('No arguments provided. For comprehensive help, install:\n');
    process.stdout.write('  npm install @or-q/plugin-help\n');
    process.stdout.write('Then run: or-q help\n\n');
    process.stdout.write(`Available commands: ${runtime.commandNames.join(', ')}\n`);
  }
  return;
}
```

### Core Runtime Cleanup

```typescript
// Remove from packages/core/src/index.ts
// Delete the usage() method and its interface declaration
```

## Benefits

### User Experience

- **Discoverable**: Clear command names that users can guess
- **Comprehensive**: Covers commands, plugins, and scripts
- **Consistent**: Uniform help format across all components
- **Progressive**: Basic help available, detailed help optional

### Developer Experience

- **Plugin-friendly**: Easy for plugin authors to integrate help
- **Machine-readable**: JSON output for tooling integration
- **Maintainable**: Centralized help system with clear responsibilities

### Architectural Benefits

- **Constraint-compliant**: Works within OR-Q's argument limitations
- **Modular**: Help system is optional and pluggable
- **Extensible**: Easy to add new help categories
- **Clean**: Removes architectural debt from core runtime

## Migration Strategy

### Backward Compatibility

- Existing commands continue to work unchanged
- `list-*` commands deprecated but not immediately removed
- Gradual migration path for users

### Documentation Updates

- Update README.md with help command examples
- Add help plugin to recommended plugin list
- Document the new help command structure

### Plugin Author Guidelines

- Provide templates for plugin help integration
- Document best practices for command descriptions
- Create examples of help-friendly plugin design

## Future Enhancements

### Enhanced Script Help

- Parse YAML script comments for documentation
- Support for parameter schemas and validation
- Interactive script builders

### Context-Aware Help

- Command history integration
- Suggested next commands
- Error-specific help recommendations

### Visual Help

- ASCII art diagrams for complex workflows
- Color-coded output for better readability
- Interactive help navigation

## Risks and Mitigations

### Risk: Command Namespace Pollution

**Mitigation**: Use consistent `help-*` prefix to group related commands

### Risk: Plugin Dependency Issues

**Mitigation**: Make help plugin optional with graceful fallbacks

### Risk: Maintenance Overhead

**Mitigation**: Automated help generation from plugin metadata where possible

## Success Criteria

1. **User Adoption**: Users can discover and use help commands intuitively
2. **Plugin Integration**: Plugin authors adopt help-friendly practices
3. **CLI Improvement**: No-argument CLI invocation provides useful guidance
4. **Code Quality**: Removal of "Lazy" usage() method from core
5. **Documentation**: Comprehensive help available for all system components

## Conclusion

This proposal provides a comprehensive solution to OR-Q's help system needs while respecting the architectural
constraints of the pipeline system. By embracing explicit command names instead of fighting optional arguments, we
create a more discoverable and maintainable help system that can grow with the OR-Q ecosystem.

The implementation follows OR-Q's plugin-based architecture, making the help system optional while providing clear value
to users who install it. The design also sets up a foundation for future enhancements while immediately addressing the
first priority item in TODO.md.
