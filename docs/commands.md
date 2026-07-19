# or-q command reference

16 plugins, 105 commands.

## @or-q/plugin-alias

Registers commands from `src/commands/alias.ts` (via `commandsFromImports`). 1 command.

### alias

- Usage: `alias "<name>" "<description>" [placeholders] [commands]`
- Description: declares a command alias which may accept arguments via placeholders, forwards input
- Input: forwarded unchanged; the command reads its four args (name, description, placeholder list, program), validates
  that name/placeholders are not already-registered command names, and calls `runtime.addCommand` to register a new
  command that substitutes placeholder values into the stored program before running it.
- Output: returns the input untouched (registration is a side effect). The registered alias's description gets `[alias]`
  (with a leading space) appended.

## @or-q/plugin-core

Merges eleven command modules. 46 commands.

### list-assets

- Usage: `list-assets`
- Description: prints the list of available assets to stdout, passes input along
- Input: forwarded unchanged.
- Output: input; writes `Available assets:` plus each asset (basename + full name) to stdout as a side effect.

### glob-assets

- Usage: `glob-assets "<glob>"`
- Description: replaces input with list of globbed assets
- Input: ignored.
- Output: JSON array of asset URIs matching the glob, with a trailing newline.

### cat

- Usage: `cat "<file>"`
- Description: replaces input with file or asset
- Input: ignored.
- Output: the resolved asset/file text. Unqualified URIs are matched against `plugin:*/**/<uri>`; on multiple matches it
  warns and uses the first sorted match; fails if nothing resolves.

### resolve-asset

- Usage: `resolve-asset` (no usage string; reads URI from input)
- Description: replaces input with file or asset resolved from it
- Input: read as a string and used as the URI (same resolution as `cat`).
- Output: the resolved asset/file text; fails if not found.

### equals

- Usage: `equals "<lhs>" "<rhs>"`
- Description: replaces input with `true` if arguments are equal, with `false` otherwise
- Input: ignored.
- Output: `"true"` or `"false"` from string comparison of the two args.

### matches

- Usage: `echo "<input>" matches "<pattern>"`
- Description: replaces input with `true` if input matches the argument, with `false` otherwise
- Input: tested against `new RegExp(pattern)`.
- Output: `"true"`/`"false"`.

### contains

- Usage: `echo "<input>" contains "<substring>"`
- Description: replaces input with `true` if input contains the argument, with `false` otherwise
- Input: tested with `String.includes`.
- Output: `"true"`/`"false"`.

### then

- Usage: `then ["<commands>"]`
- Description: runs commands only if trimmed input is `true`
- Input: read as string; if trimmed value is `true`, the argument program runs on it, otherwise input passes through.
- Output: the program's output when input is `true`, else the input unchanged.

### else

- Usage: `else ["<commands>"]`
- Description: runs commands only if trimmed input is NOT `true`
- Input: read as string; if trimmed value is not `true`, the argument program runs on it, else input passes through.
- Output: the program's output when input is not `true`, else the input unchanged.

### if-then

- Usage: `if-then ["<commands">] ["<commands>"]` (usage string in source contains a stray quote)
- Description: runs commands from the second argument only if the first argument is `true`, passes input to both
  arguments
- Input: read to a string; the condition program is run on it; if its trimmed output is `true`, the second program runs
  on the input.
- Output: the second program's output when condition holds, else the input unchanged.

### dump

- Usage: `dump`
- Description: replaces input with remaining program dump
- Input: ignored.
- Output: JSON of the remaining `args` array, with a trailing newline. (Does not consume args.)

### rem

- Usage: `rem`
- Description: consumes all remaining arguments and replaces input with them in JSON
- Input: ignored.
- Output: JSON of all remaining args (which it splices out/consumes), with a trailing newline.

### fail

- Usage: `fail "<message>"`
- Description: fails with an error message
- Input: ignored.
- Output: never returns — throws `PluginRuntimeFailure` with the trimmed message (or a default if empty).

### call

- Usage: `call "<command>" "<input>"`
- Description: calls command feeding it argument as input
- Input: ignored (the pipeline input is replaced by the second arg).
- Output: result of running `[command]` with the second arg as input.

### head

- Usage: `head N`
- Description: returns first N items from the input array
- Input: parsed as a YAML array; sliced to the first N elements. `N=0` returns input unchanged; non-integer/negative N
  fails.
- Output: pretty-printed (2-space) JSON array of the first N items.

### sort

- Usage: `sort`
- Description: sorts input array
- Input: parsed as a YAML array and sorted by `localeCompare`.
- Output: JSON array, with a trailing newline.

### map

- Usage: `map [program]`
- Description: applies commands from the argument to each entry of the input array, returns resulting array
- Input: parsed as a YAML array; the program runs on each entry, results collected as strings.
- Output: pretty-printed (2-space) JSON array of per-entry results.

### stream-map

- Usage: `stream-map [program]`
- Description: applies commands from the argument to each entry of the input array, streaming to input
- Input: parsed as a YAML array; the program runs per entry, yields streamed.
- Output: a `Readable` (object mode) streaming each entry's output; not aggregated into a JSON array.

### map-n

- Usage: `map-n N [program1] ... [programN]`
- Description: applies programs from the argument to each entry of the input array, returns resulting array of arrays
- Input: parsed here with `JSON.parse` (not YAML) as an array; each entry is run through all N programs. `N=1` returns
  input unchanged; invalid N fails.
- Output: pretty-printed JSON array of rows, each row the N program results for one entry.

### parallel-map-n

- Usage: `parallel-map-n N [program1] ... [programN]`
- Description: applies programs from the argument to each entry of the input array in parallel, returns resulting array
  of arrays
- Input: parsed as a YAML array; every entry×program combination runs concurrently via `Promise.all`, each in a
  throwaway `runtime.clone()` (so scope/storage mutations are silently discarded per the source note).
- Output: pretty-printed JSON array of rows.

### prepend

- Usage: `prepend "\n<text>\n"`
- Description: prepends argument to input, does NOT insert a newline at either end of argument
- Input: read as string, argument prepended.
- Output: `argument + input`.

### append

- Usage: `append "\n<text>\n"`
- Description: appends argument to input, does NOT insert a newline at either end of argument
- Input: read as string, argument appended.
- Output: `input + argument`.

### input

- Usage: `input`
- Description: forwards input (useful for program arguments sometimes)
- Input: read to a string.
- Output: the input as a string.

### -

- Usage: `-`
- Description: read data from stdin, ignoring input
- Input: ignored.
- Output: `process.stdin` (a stream).

### print

- Usage: `print "<text>"`
- Description: prints trimmed argument to stdout, passing input forward
- Input: forwarded unchanged.
- Output: input; writes the trimmed argument + newline to stdout.

### tee

- Usage: `tee`
- Description: outputs end-trimmed input to stdout, passes it along untrimmed
- Input: read as string; end-trimmed copy written to stdout.
- Output: the input untrimmed. (Source notes this is not a real `tee`.)

### echo

- Usage: `echo "<text>"`
- Description: replaces input with argument
- Input: ignored.
- Output: the argument string.

### default

- Usage: `default "<text>"`
- Description: if input is empty, replaces it with argument
- Input: read as string; if empty, replaced by argument.
- Output: input if non-empty, else the argument.

### clear

- Usage: `clear`
- Description: replaces input with empty string
- Input: ignored.
- Output: `""`.

### readline

- Usage: `readline "<prompt>"`
- Description: replaces input with a line from stdin
- Input: ignored.
- Output: one line read interactively from stdin after printing the prompt.

**spam / debug / info / log / warn / error / none** (7 commands, generated per log level)

- Usage: `<level> "<text>"` (e.g. `debug "<text>"`)
- Description: `logs text with <level> level, forwards input`
- Input: forwarded unchanged.
- Output: input; emits a `LoggingEvent` at that level with the argument text as a side effect. (`none` is included as a
  level name.)

### list-plugins

- Usage: `list-plugins`
- Description: prints the list of available plugins to stdout, passes input along
- Input: forwarded unchanged.
- Output: input; writes the plugin-name list to stdout.

### plugins-json

- Usage: `plugins-json`
- Description: replaces input with a full information on available plugins
- Input: ignored.
- Output: `JSON.stringify(runtime.plugins)` (no trailing newline, not pretty-printed).

### secret

- Usage: `secret "<id>"`
- Description: replaces input with a secret
- Input: ignored.
- Output: the value of `process.env[id]`; fails if that env var is unset. (Source notes it does not yet protect the
  value from log exposure.)

### unquote

- Usage: `unquote`
- Description: unquotes input JSON string (useful in conjunction with jp)
- Input: `JSON.parse`d.
- Output: the parsed value (intended for a JSON string).

### quote

- Usage: `quote`
- Description: quotes input to JSON string
- Input: read as string.
- Output: `JSON.stringify(input)`.

### replace

- Usage: `replace "<from>" "<to>"`
- Description: replaces substring with new string in input
- Input: read as string; `replaceAll(from, to)`.
- Output: the replaced string.

### trim

- Usage: `trim`
- Description: trims input
- Input: read as string, `.trim()`.
- Output: trimmed string.

### trimStart

- Usage: `trimStart`
- Description: trims input start
- Input: read as string, `.trimStart()`.
- Output: start-trimmed string.

### trimEnd

- Usage: `trimEnd`
- Description: trims input end
- Input: read as string, `.trimEnd()`.
- Output: end-trimmed string.

## @or-q/plugin-dot-or-q-assets

Registers no commands — it only loads assets from `./.or-q/assets/` under the current working directory (lazily, per the
source comment). 0 commands.

## @or-q/plugin-fetch

1 command.

### fetch

- Usage: `fetch-json "<url>"` (usage string names `fetch-json`, but the registered command is `fetch` — ambiguity in the
  source)
- Description: fetches data from a provided URL, with input as request body
- Input: parsed as YAML into a fetch config object; if `body` is an object and `Content-Type` is `application/json`, the
  body is JSON-stringified.
- Output: the HTTP response body as a `Readable` stream; fails if the body is null. (Source notes HTTP status codes,
  esp. 429, are not yet handled.)

## @or-q/plugin-filesystem

Merges four modules. 8 commands.

### cat-file

- Usage: `cat-file <filename>`
- Description: replaces input with the file contents from argument
- Input: ignored.
- Output: UTF-8 contents of the file named by the argument (`readFileSync`).

### file

- Usage: `file`
- Description: converts input filename to the file contents
- Input: read as a string filename.
- Output: UTF-8 contents of that file.

### dirtree-json

- Usage: `dirtree-json`
- Description: consumes list of paths, returns hierarchy as JSON
- Input: parsed as a YAML list of paths, sorted, converted to a nested directory object.
- Output: pretty-printed JSON of the hierarchy.

### dirtree-annotated-json

- Usage: `dirtree-annotated-json`
- Description: consumes list of path - annotation pairs, returns hierarchy as JSON
- Input: parsed as a YAML array of `[path, annotation]` pairs (fails if not an array), sorted by path.
- Output: pretty-printed JSON hierarchy with leaf annotations.

### dirtree

- Usage: `dirtree`
- Description: consumes list of paths or dirtree-json output, returns hierarchy as text
- Input: parsed as YAML; if an array it is converted to a tree object first.
- Output: a `./`-rooted text tree rendered via `treeify`.

### glob

- Usage: `glob "pattern" "ignore-pattern"`
- Description: replaces input with a list of files matching pattern in JSON
- Input: ignored.
- Output: pretty-printed JSON array of matching files (`nodir: true`, cwd = process cwd).

### glob3

- Usage: `glob "pattern" "ignore-pattern" "options"` (usage string names `glob`; the command is `glob3` — ambiguity)
- Description: replaces input with a list of files matching pattern in JSON, accepts arguments as JSON values
- Input: ignored.
- Output: pretty-printed JSON array of matches; all three args are `JSON.parse`d, options spread into the glob call
  (`nodir` defaults to true).

### ignore

- Usage: `ignore "patterns"`
- Description: filters a list of file and directory paths based on .gitignore-like filters
- Input: parsed as a YAML list of pathnames, filtered by the `ignore` library using the argument patterns.
- Output: pretty-printed JSON array of the surviving paths.

## @or-q/plugin-format

3 commands.

### pretty

- Usage: `pretty`
- Description: pretty-prints JSON
- Input: `JSON.parse`d.
- Output: 2-space pretty-printed JSON.

### yaml

- Usage: `yaml`
- Description: converts JSON to YAML
- Input: `JSON.parse`d.
- Output: YAML string.

### tsv

- Usage: `tsv`
- Description: converts input JSON or YAML array of arrays to TSV
- Input: parsed as YAML into an array of rows.
- Output: tab-joined rows separated by newlines. (Source notes it is fragile.)

## @or-q/plugin-jp

1 command.

### jp

- Usage: `jp "[JMSEPath query string]"`
- Description: run JMSEPath's jp command
- Input: piped as stdin into the external `jp` process.
- Output: trimmed stdout of `jp` invoked with the query as an argument (via `spawnText`). Requires the external `jp`
  binary.

## @or-q/plugin-macro

4 commands.

### $defmacro

- Usage: `$defmacro <name> <def>`
- Description: stores or overrides a macro definition, forwards input
- Input: forwarded unchanged.
- Output: input; stores `def` (a string parsed as YAML, or an array) under `name` in a module-level macro table. Fails
  on a duplicate name. (Description says "overrides" but the code rejects duplicates — an inconsistency in the source.)

### $macro

- Usage: `$macro [<macro>, ...args]`
- Description: invokes macro
- Input: passed as the input to the macro's command program.
- Output: result of running the named macro's stored program in a context carrying the resolved args; fails on an
  unknown macro. The def is deep-cloned via JSON round-trip.

### $arg

- Usage: `$arg <n>`
- Description: macro argument placeholder
- Input: ignored.
- Output: the n-th argument from the enclosing `$macro` context; fails if run outside a `$macro` context or if the index
  is missing.

### dump-macros

- Usage: `dump-macros`
- Description: replaces input with macros saved as JSON
- Input: forwarded unchanged.
- Output: input; writes the macro table as pretty JSON to stdout as a side effect. (Description says "replaces input"
  but the code returns the input and only prints — an inconsistency in the source.)

## @or-q/plugin-ollama

Merges `ollama` and `openai` modules. 3 commands.

### ollama-generate

- Usage: `ollama-generate`
- Description: feeds input in the native Ollama format to the local Ollama instance generate REST API
- Input: sent as the request body (POST, JSON content type) to `http://localhost:11434/api/generate`.
- Output: response body as a `Readable` stream; fails if null.

### ollama-chat

- Usage: `ollama-chat`
- Description: feeds input in the native Ollama format to the local Ollama instance chat REST API
- Input: POSTed as body to `http://localhost:11434/api/chat`.
- Output: response body stream; fails if null.

### ollama

- Usage: `ollama`
- Description: feeds OpenAI-compatible input to the local Ollama instance OpenAI completions API wrapper
- Input: POSTed as body to `http://localhost:11434/v1/chat/completions`.
- Output: response body stream; fails if null.

## @or-q/plugin-openrouter-api

Merges three modules. 8 commands.

### completions

- Usage: `completions`
- Description: feeds input to the OpenRouter completions API, requires OPENROUTER_API_KEY env variable
- Input: POSTed as body (with `Authorization: Bearer $OPENROUTER_API_KEY`) to
  `https://openrouter.ai/api/v1/chat/completions`.
- Output: response body as a `Readable` stream; fails if the env var is missing or the body is null.

### conversation

- Usage: `conversation "<model>"`
- Description: replaces input with an empty conversation object
- Input: ignored.
- Output: `JSON.stringify({ model, messages: [] })`.

### system

- Usage: `system "<message>"`
- Description: appends system message to an conversation object in input
- Input: `JSON.parse`d as a conversation; the message is pushed with role `system`.
- Output: pretty-printed JSON of the updated conversation.

### user

- Usage: `user "<message>"`
- Description: appends user message to an conversation object in input
- Input: parsed conversation; message pushed with role `user`.
- Output: pretty-printed JSON conversation.

### assistant

- Usage: `assistant "<message>"`
- Description: appends assistant message to an conversation object in input
- Input: parsed conversation; message pushed with role `assistant`.
- Output: pretty-printed JSON conversation.

### tool

- Usage: `tool "<message>"`
- Description: appends tool message to an conversation object in input
- Input: parsed conversation; message pushed with role `tool`.
- Output: pretty-printed JSON conversation.

### temperature

- Usage: `temperature "<number in [0..2]>"`
- Description: changes conversation object temperature
- Input: `JSON.parse`d conversation; sets `temperature` to the numeric arg (validated to be a number in [0,2], else
  fails).
- Output: pretty-printed JSON conversation.

### models

- Usage: `models`
- Description: replaces input with data from OpenResty models endpoint (description says "OpenResty"; the URL is
  OpenRouter — apparent typo)
- Input: ignored.
- Output: GET response body from `https://openrouter.ai/api/v1/models` as a stream; fails if null.

## @or-q/plugin-shell

1 command.

### shell

- Usage: `shell "[shell command]"`
- Description: run a shell command (use with caution)
- Input: piped into the spawned command's stdin.
- Output: trimmed stdout of the command run with `shell: true` (via `spawnText`).

## @or-q/plugin-stdio-logger

Also registers a `log` event listener that prints level ≥ the current threshold (default `log`) to the console with a
`level<TAB>source<TAB>` prefix. 1 command.

### stdio-loglevel

- Usage: `loglevel "spam|debug|info|log|warn|error|none"` (usage string names `loglevel`; the registered command is
  `stdio-loglevel` — ambiguity)
- Description: changes loglevel, useful for debugging
- Input: forwarded unchanged.
- Output: input; sets the plugin's log-level threshold as a side effect. Fails on an unknown level.

## @or-q/plugin-store

Values are kept in a runtime context (`context:@or-q/plugin-store:store`). 5 commands.

### load

- Usage: `load "<text>"`
- Description: loads a named value from the store, replacing input with it, unknown values are empty strings
- Input: ignored.
- Output: the stored string for the key (an unknown key yields `""`); if the stored value is a stream it is read to a
  string and cached back.

### save

- Usage: `save "<key>"`
- Description: saves input into a named value of the store, passes input along
- Input: stored under the key (possibly still as a stream — source raises the question) and forwarded.
- Output: the input unchanged.

### set

- Usage: `set "<key>" "<value>"`
- Description: sets key to value in store, forwards input
- Input: forwarded unchanged.
- Output: input; stores the value arg under the key.

### setdata

- Usage: `setdata "<key>" "<value>"`
- Description: sets key to value in store, treating value as data and serializing it to JSON, forwards input
- Input: forwarded unchanged.
- Output: input; stores `JSON.stringify(value)` (the raw arg, which may be an array) under the key. Fails if the value
  arg is missing.

### dump-store

- Usage: `dump-store`
- Description: dumps store content to stdout as JSON, passes input forward
- Input: forwarded unchanged.
- Output: input; writes the store as pretty JSON to stdout as a side effect.

## @or-q/plugin-template

Templates use `${ ... }` expressions (with `\` escaping and brace nesting), each rendered by running its contents as
or-q commands. 10 commands.

### f

- Usage: `f "[template]"`
- Description: replaces input with a template instantiated from @orq/store, feeding it input
- Input: read as string and passed as the input to every `${...}` expression while rendering the template argument.
- Output: the rendered template string.

### t

- Usage: `t "[template]"`
- Description: replaces input with a template instantiated from @orq/store
- Input: ignored (expressions render with empty input).
- Output: the rendered template string.

### render

- Usage: `echo "<template>" | render`
- Description: treats input as a template and instantiates it from @orq/store
- Input: read as string and used as the template itself.
- Output: the rendered string.

**spam-f / debug-f / info-f / log-f / warn-f / error-f / none-f** (7 commands, generated per log level)

- Usage: `<level>-f "<template>"` (e.g. `debug-f "<template>"`)
- Description: `instantiates and logs template with <level>-f level, forwards input`
- Input: read as string, used as the input while rendering the template argument, then forwarded.
- Output: input; emits a `LoggingEvent` at the level with the rendered text as a side effect.

## @or-q/plugin-test

Registers commands from `discover-tests.ts` and `run-test-suite.ts`. 2 commands.

### discover-tests

- Usage: `discover-tests`
- Description: replaces input with the list of available tests in JSON
- Input: ignored.
- Output: JSON array of sorted test-suite names, with a trailing newline.

### run-test-suite

- Usage: `echo "<name>" | run-test-suite`
- Description: runs a test suite from filesystem or assets
- Input: read as the suite URI; resolved and loaded as a test suite (fails if not found).
- Output: the result of `runTestSuite`. (Source notes: the exact return shape isn't machine-readable yet — treat as an
  open ambiguity.)

## @or-q/plugin-yaml-script

Runs YAML-defined command scripts. 11 commands (including three reserved non-commands).

### exec

- Usage: `exec "<yaml>", you may use run <(cat filename.yaml) to read from file`
- Description: executes YAML script from argument
- Input: passed as the input to the loaded program.
- Output: the program's output.

### exec-input

- Usage: `exec-input`
- Description: executes YAML script from input
- Input: read as string and loaded/run as a YAML script (with empty program input `''`).
- Output: the program's output.

### list-script-assets

- Usage: `list-script-assets`
- Description: prints the list of available builtin scripts to stdout, passes input along
- Input: forwarded unchanged.
- Output: input; writes the sorted `**/scripts/**/*.yaml` asset list to stdout.

### load-yaml-script-asset

- Usage: `load-yaml-script "<file>"` (usage string names `load-yaml-script`; command is `load-yaml-script-asset` —
  ambiguity)
- Description: loads YAML script from file and returns commands as JSON
- Input: ignored.
- Output: JSON of the compiled command array (with trailing newline); resolves the URI under a `scripts` subdir, fails
  if not found.

### load-yaml-script-input

- Usage: `load-yaml-script-input`
- Description: loads YAML script from input and returns commands as JSON
- Input: read as string and compiled to a command array.
- Output: JSON of the compiled commands, with a trailing newline.

### run

- Usage: `run "<file>"`
- Description: runs YAML script file from file: or plugin:
- Input: passed as input to the loaded program.
- Output: the program's output; resolves the URI under a `scripts` subdir, fails if not found.

### forever

- Usage: `forever [actions]`
- Description: runs forever, interrupt to exit
- Input: fed into the actions, then re-fed with each iteration's output, looping indefinitely.
- Output: never returns normally (infinite loop; exit by interrupt). Does not do sub-command expansion on its argument.

### on-empty-stdin

- Usage: `on-empty-stdin [actions]`
- Description: if input is empty, runs commands to populate, treats TTY stdin as empty
- Input: if input is `process.stdin` on a TTY it is treated as empty; read to a string; if empty the actions run.
- Output: the input if non-empty, else the actions' output. No sub-command expansion on the argument.

### \_DATA

- Usage: `_DATA` (reserved marker, not a runnable command)
- Description: not a command, reserved to use \_DATA in yaml-scripts to create JSON arguments
- Input: ignored.
- Output: always fails with `_DATA is not a command`; the loader special-cases `_DATA` nodes to inject JSON arguments
  before execution.

### \_JSON

- Usage: `_JSON` (reserved marker, not a runnable command)
- Description: not a command, reserved to use \_JSON in yaml-scripts to create JSON inputs
- Input: ignored.
- Output: always fails (throws `_DATA is not a command` — the error text is copy-pasted, a source bug); the loader
  special-cases `_JSON` nodes into `_RAW` + JSON.

### \_RAW

- Usage: `_RAW "<data>"`
- Description: replaces single-key `_RAW: [or-q commands]` nodes in JSON or YAML argument with the command output
- Input: ignored.
- Output: JSON of the argument data with every single-key `_RAW` object recursively replaced by the output of running
  its command list (each on empty input), with a trailing newline.

## Index

- `-` — @or-q/plugin-core
- `$arg` — @or-q/plugin-macro
- `$defmacro` — @or-q/plugin-macro
- `$macro` — @or-q/plugin-macro
- `_DATA` — @or-q/plugin-yaml-script
- `_JSON` — @or-q/plugin-yaml-script
- `_RAW` — @or-q/plugin-yaml-script
- alias — @or-q/plugin-alias
- append — @or-q/plugin-core
- assistant — @or-q/plugin-openrouter-api
- call — @or-q/plugin-core
- cat — @or-q/plugin-core
- cat-file — @or-q/plugin-filesystem
- clear — @or-q/plugin-core
- completions — @or-q/plugin-openrouter-api
- contains — @or-q/plugin-core
- conversation — @or-q/plugin-openrouter-api
- debug — @or-q/plugin-core
- debug-f — @or-q/plugin-template
- default — @or-q/plugin-core
- dirtree — @or-q/plugin-filesystem
- dirtree-annotated-json — @or-q/plugin-filesystem
- dirtree-json — @or-q/plugin-filesystem
- discover-tests — @or-q/plugin-test
- dump — @or-q/plugin-core
- dump-macros — @or-q/plugin-macro
- dump-store — @or-q/plugin-store
- echo — @or-q/plugin-core
- else — @or-q/plugin-core
- equals — @or-q/plugin-core
- error — @or-q/plugin-core
- error-f — @or-q/plugin-template
- exec — @or-q/plugin-yaml-script
- exec-input — @or-q/plugin-yaml-script
- f — @or-q/plugin-template
- fail — @or-q/plugin-core
- fetch — @or-q/plugin-fetch
- file — @or-q/plugin-filesystem
- forever — @or-q/plugin-yaml-script
- glob — @or-q/plugin-filesystem
- glob-assets — @or-q/plugin-core
- glob3 — @or-q/plugin-filesystem
- head — @or-q/plugin-core
- if-then — @or-q/plugin-core
- ignore — @or-q/plugin-filesystem
- info — @or-q/plugin-core
- info-f — @or-q/plugin-template
- input — @or-q/plugin-core
- jp — @or-q/plugin-jp
- list-assets — @or-q/plugin-core
- list-plugins — @or-q/plugin-core
- list-script-assets — @or-q/plugin-yaml-script
- load — @or-q/plugin-store
- load-yaml-script-asset — @or-q/plugin-yaml-script
- load-yaml-script-input — @or-q/plugin-yaml-script
- log — @or-q/plugin-core
- log-f — @or-q/plugin-template
- map — @or-q/plugin-core
- map-n — @or-q/plugin-core
- matches — @or-q/plugin-core
- models — @or-q/plugin-openrouter-api
- none — @or-q/plugin-core
- none-f — @or-q/plugin-template
- ollama — @or-q/plugin-ollama
- ollama-chat — @or-q/plugin-ollama
- ollama-generate — @or-q/plugin-ollama
- on-empty-stdin — @or-q/plugin-yaml-script
- parallel-map-n — @or-q/plugin-core
- plugins-json — @or-q/plugin-core
- prepend — @or-q/plugin-core
- pretty — @or-q/plugin-format
- print — @or-q/plugin-core
- quote — @or-q/plugin-core
- readline — @or-q/plugin-core
- rem — @or-q/plugin-core
- render — @or-q/plugin-template
- replace — @or-q/plugin-core
- resolve-asset — @or-q/plugin-core
- run — @or-q/plugin-yaml-script
- run-test-suite — @or-q/plugin-test
- save — @or-q/plugin-store
- secret — @or-q/plugin-core
- set — @or-q/plugin-store
- setdata — @or-q/plugin-store
- shell — @or-q/plugin-shell
- sort — @or-q/plugin-core
- spam — @or-q/plugin-core
- spam-f — @or-q/plugin-template
- stdio-loglevel — @or-q/plugin-stdio-logger
- stream-map — @or-q/plugin-core
- system — @or-q/plugin-openrouter-api
- t — @or-q/plugin-template
- tee — @or-q/plugin-core
- temperature — @or-q/plugin-openrouter-api
- then — @or-q/plugin-core
- tool — @or-q/plugin-openrouter-api
- trim — @or-q/plugin-core
- trimEnd — @or-q/plugin-core
- trimStart — @or-q/plugin-core
- tsv — @or-q/plugin-format
- unquote — @or-q/plugin-core
- user — @or-q/plugin-openrouter-api
- warn — @or-q/plugin-core
- warn-f — @or-q/plugin-template
- yaml — @or-q/plugin-format
