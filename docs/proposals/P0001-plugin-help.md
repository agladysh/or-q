# P0001: Help Plugin Implementation

**Status**: Draft **Author**: System Analysis **Date**: 2025-01-27 **Priority**: First Priority (per TODO.md)

## Summary

This proposal outlines the implementation of a comprehensive help system for OR-Q through a dedicated
`@or-q/plugin-help` package. The design addresses the architectural constraints of the OR-Q pipeline system while
providing intuitive help functionality for users.

## Motivation

### Why This Approach

OR-Q's current help situation is problematic:

1. **User Onboarding**: New users cannot discover available functionality
2. **Plugin Discovery**: No way to understand what plugins provide
3. **Script Visibility**: YAML scripts are invisible without prior knowledge
4. **Developer Experience**: Plugin authors have no standard way to expose help
5. **Architectural Debt**: Core runtime has a "Lazy" usage() method that needs removal

### Why Not Optional Arguments

The ideal solution would be `help [command]` syntax, but OR-Q's sequential argument consumption (`args.shift()`) makes
optional arguments architecturally impossible. Commands cannot peek ahead without consuming arguments.

### Why Plugin-Based

- **Modularity**: Help system doesn't bloat core runtime
- **Extensibility**: Plugins can contribute their own discovery commands
- **Maintenance**: Help logic separated from core pipeline execution
- **Dependency Management**: Can be added as a core dependency to solve chicken-and-egg problems

## Background

### Current State

OR-Q currently lacks a comprehensive help system. The CLI falls back to a "Lazy" `runtime.usage()` method that simply
lists available commands. Users have no way to:

- Get detailed help for specific commands
- Understand plugin functionality
- Discover available YAML scripts
- Access comprehensive system documentation

## Design Principles

### 1. Programmatic Content Generation

All help commands are programmatic, using existing content:

- **Plugin metadata**: `pkg.name`, `pkg.description` from package.json
- **Command descriptions**: Already present in command definitions
- **Runtime state**: Available plugins, commands, assets from runtime
- **No duplication**: No separate help content to maintain

### 2. Explicit Command Structure

Instead of fighting the architectural constraints, we embrace them by creating explicit, discoverable command names:

- `help` - System overview with plugin descriptions and available help commands
- `help-<plugin-name>` - Plugin-specific help (each plugin can export these)
- `discover-commands` - All commands with optional tags for categorization
- `discover-plugins` - Plugin metadata in JSON format
- `discover-scripts` - YAML scripts discovery (from yaml-script plugin)

### 3. Enhanced Command Metadata

Commands get an optional `tags` array for flexible categorization. Tags recognized by the help and discovery systems:

- `help-command`: Commands that provide help functionality
- `discover-command`: Commands that provide discovery/metadata functionality

Plugins can use additional domain-specific tags as needed.

### 4. Separation of Concerns

- **Human-readable help**: `help` and `help-*` commands provide formatted, user-friendly output
- **Machine-readable data**: `discover-*` commands provide structured data for programmatic use
- **Plugin-extensible**: Each plugin can export its own help and discovery commands

### 5. CLI Integration

When OR-Q is invoked with no arguments:

1. Check if `help` command exists in the runtime
2. If yes, execute it and display the output
3. If no, show a generic fallback message recommending `@or-q/plugin-help`

## Detailed Design

### Core Help Commands

#### `help`

**Description**: Shows system overview **Arguments**: None **Output**:

- Plugin list with `pkg.name` and `pkg.description`
- Available help commands (`help-<plugin-name>`, `discover-*`)
- Basic usage guidance
- Kept concise to avoid information overload

#### `help-<plugin-name>`

**Description**: Plugin-specific help commands (exported by individual plugins) **Arguments**: None **Output**:

- Commands provided by that plugin with descriptions
- Plugin-specific usage notes
- Examples relevant to the plugin

**Implementation**: Each plugin optionally exports these commands using existing command descriptions and plugin
metadata.

### Discovery Commands

#### `discover-commands`

**Description**: Lists all available commands with metadata **Arguments**: None **Output**: JSON structure with:

- Command names, descriptions, and tags
- Source plugin for each command
- Complete command metadata for tooling integration

#### `discover-plugins`

**Description**: Lists all installed plugins **Arguments**: None **Output**: JSON structure with:

- Plugin names, versions, and descriptions
- Commands provided by each plugin
- Plugin metadata for tooling integration

#### `discover-scripts`

**Description**: Lists all available YAML scripts **Arguments**: None **Output**: JSON structure with:

- Script names and descriptions
- Required plugins
- Script metadata for tooling integration

**Plugin-Extensible**: Plugins can export their own `discover-*` commands for specialized discovery needs.

## Implementation Plan

### Phase 1: Core Help Plugin

1. **Create `@or-q/plugin-help` package**
   - Basic package structure with TypeScript setup
   - Core help commands implementation
   - Integration with existing plugin system

2. **Implement basic help commands**
   - `help` - system overview with plugin descriptions
   - `discover-commands` - all commands with tags
   - Add `@or-q/plugin-help` as core dependency to CLI package

3. **CLI integration**
   - Modify `packages/cli/src/main.ts` to check for help command
   - Remove `runtime.usage()` method from core
   - Add fallback message for missing help plugin

### Phase 2: Plugin Integration

1. **Plugin-specific help**
   - Enable plugins to export `help-<plugin-name>` commands
   - `discover-plugins` implementation
   - Integration with plugin metadata and package.json

2. **Command metadata enhancement**
   - Add optional `tags: string[]` field to Command interface
   - Update existing plugins to include relevant tags
   - Enhance `discover-commands` to support tag-based categorization

### Phase 3: Script Integration

1. **YAML script discovery** (implemented in yaml-script plugin)
   - `discover-scripts` JSON output
   - Script metadata parsing from YAML files
   - Integration with existing asset system

### Phase 4: Command Cleanup

1. **Triage existing commands**
   - `list-plugins` → `discover-plugins`
   - Evaluate and potentially migrate other `list-*` commands
   - Remove redundant commands
   - Update documentation

## Technical Implementation Details

### Plugin Interface Updates

**Enhanced Plugin Interface**: Add `description` field alongside existing `name` field

**Enhanced Command Interface**: Add optional `tags: string[]` field for categorization

**CLI Integration**: Check for `help` command existence and execute on no-arguments invocation

**Core Runtime Cleanup**: Remove "Lazy" `usage()` method from core runtime

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

**Mitigation**: Add help plugin as core dependency to CLI package, ensuring it's always available

### Risk: Maintenance Overhead

**Mitigation**: All help content is programmatically generated from existing metadata - no separate content to maintain

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
