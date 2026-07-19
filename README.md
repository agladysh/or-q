# OR-Q: OpenRouter Query Porcelain Tool with Plugins

## What or-q is

or-q is a command-line porcelain for querying OpenRouter (and other LLM backends) built entirely out of small,
composable commands. Every command takes one input string, transforms it, and returns one output string, so a program is
just a chain of commands: the output of each becomes the input of the next. You write that chain either inline on the
command line (`or-q cmd1 args cmd2 args …`) or as a YAML-script file run with the `run`/`exec` commands. All behaviour —
HTTP calls, conversation building, file access, templating, testing — is contributed by plugins loaded from
`node_modules`, currently 16 plugins providing 105 commands.

## Install

or-q is a pnpm workspace; the CLI runs its TypeScript sources directly, so a recent Node (with
`--experimental-strip-types`, i.e. Node 22+/24) is required.

```sh
git clone <repo-url> or-q
cd or-q
pnpm install
```

Then either run the tool through the workspace:

```sh
pnpm or-q echo "hello"
```

or link the CLI packages globally so `or-q` is on your `PATH`:

```sh
pnpm run link   # links @or-q/cli and @or-q/cli-plugins globally
or-q echo "hello"
```

Backends that need credentials read them from the environment (e.g. `OPENROUTER_API_KEY` for `completions`/`models`);
the CLI auto-loads a `.env` file if one is present.

## Quickstart

A single command. `echo` ignores its input and replaces it with its argument; the result is written to stdout with a
trailing newline:

```sh
or-q echo "Hello, or-q!"
```

```text
Hello, or-q!
```

A chain. Each command feeds the next — `echo` produces the string, `append` concatenates its argument onto it (no
newline inserted):

```sh
or-q echo "hello" append " world"
```

```text
hello world
```

Input from stdin, demonstrating the ingest/emit conventions. `sort` reads its input as a YAML array, sorts it, and emits
JSON (not pretty-printed) with a trailing newline:

```sh
printf '%s' '["banana","apple","cherry"]' | or-q sort
```

```text
["apple","banana","cherry"]
```

## Conventions

- **Ingest as YAML.** Commands that expect structured input parse it as YAML (JSON is valid YAML, so both are accepted).
  Array-consuming commands such as `sort`, `map`, `head`, and `ignore` follow this rule.
- **Emit JSON, compact, newline-terminated.** Data-producing commands output JSON that is _not_ pretty-printed, and the
  CLI appends a single trailing newline to the final result. (A handful of commands intentionally pretty-print for human
  reading — e.g. `pretty`, `map`, the conversation builders — and streaming results such as HTTP responses are passed
  through as streams.) If you find a data command violating the compact-plus-newline rule, treat it as a bug to fix.
- **Plugin layout (see `@or-q/plugin-test`).** A plugin is an npm package named `@or-q/plugin-*` whose entry point
  default-exports a `Plugin` object with three fields: `name` (taken from its own `package.json`), `assets` (loaded via
  `loadModuleAssets(import.meta.url)` from the package's `assets/` directory), and `commands` (assembled with
  `commandsFromImports(pkg.name, …moduleNamespaces)` over per-command modules kept under `src/commands/`). The package's
  `package.json` ships `src`, `dist`, and `assets` in its `files`, and builds declarations with a
  `prepack: tsc --emitDeclarationOnly` script. A plugin may legitimately register zero commands and contribute only
  assets (see `@or-q/plugin-dot-or-q-assets`).

## Plugins

| Package                        | Summary                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `@or-q/plugin-alias`           | Declare argument-substituting command aliases at runtime (`alias`).                |
| `@or-q/plugin-core`            | The base command set (46 commands): transforms, control flow, I/O, introspection.  |
| `@or-q/plugin-dot-or-q-assets` | Registers no commands; lazily loads assets from `./.or-q/assets/`.                 |
| `@or-q/plugin-fetch`           | `fetch`: issue an HTTP request configured from input, returning a stream.          |
| `@or-q/plugin-filesystem`      | Read files and walk directories: `cat-file`, `file`, `glob`, `dirtree*`, `ignore`. |
| `@or-q/plugin-format`          | Reformat data between pretty JSON (`pretty`), YAML (`yaml`), and TSV (`tsv`).      |
| `@or-q/plugin-jp`              | `jp`: pipe input through the external JMESPath `jp` binary.                        |
| `@or-q/plugin-macro`           | Define and invoke named macros with positional arguments (`$defmacro`, `$macro`).  |
| `@or-q/plugin-ollama`          | Native or OpenAI-compatible requests to a local Ollama instance (`ollama`).        |
| `@or-q/plugin-openrouter-api`  | Build conversation objects and call OpenRouter `completions`/`models`.             |
| `@or-q/plugin-shell`           | `shell`: run a shell command with input piped to its stdin (use with caution).     |
| `@or-q/plugin-stdio-logger`    | Print log events to the console; set the threshold with `stdio-loglevel`.          |
| `@or-q/plugin-store`           | A runtime key/value store: `load`, `save`, `set`, `setdata`, `dump-store`.         |
| `@or-q/plugin-template`        | `${…}` templates whose expressions are or-q commands (`f`, `t`, `render`).         |
| `@or-q/plugin-test`            | Declarative test harness; also the canonical reference for plugin layout.          |
| `@or-q/plugin-yaml-script`     | Load and run YAML-defined command scripts (`exec`, `run`, `forever`).              |

## Going further

- **`TODO.md`** — planned work and known rough edges.
- **Per-plugin sources** — the authoritative description of any command is its module under `packages/<plugin>/src/`;
  each command carries its own usage and description string there.
- **Built-in help** — running `or-q` with no arguments prints the generated usage listing (`runtime.usage()`). At
  runtime, `list-plugins`/`plugins-json` enumerate loaded plugins, `list-assets`/`glob-assets` and `list-script-assets`
  enumerate available assets and YAML scripts, and `run-test-suite` (with `discover-tests`) exercises the declarative
  test suites. A dedicated full-help command does not exist yet — the source is the reference.
