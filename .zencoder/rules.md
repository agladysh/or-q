# OR-Q Input Pipelining System

## Core Pipeline Architecture

OR-Q implements a **sequential command pipeline** where each command receives input and produces output that flows to
the next command. The system enforces strict type contracts: all commands must accept `string | Readable` input and
return `string | Readable` output.

## Pipeline Flow Example

Using the `fetch-openai-instruct` script as an example:

```yaml
- _JSON: # Creates JSON string from YAML object
    method: POST
    headers:
      Content-Type: application/json
    body:
      model: 'gpt-oss:20b'
      messages: [...]
- tee # Outputs to stdout, passes input forward unchanged
- fetch: ['http://...'] # Parses input as YAML config, makes HTTP request
- tee # Outputs response to stdout, passes forward
- jp: 'choices[0].message.content' # JSONPath query on response
- unquote # Removes JSON quotes from extracted string
```

## Data Transformation Points

### 1. `_JSON` Directive (Compilation Time)

- **Input**: YAML object structure
- **Process**: Converts YAML to JSON string during script compilation
- **Output**: JSON string representation of the object
- **Example**: `{"method":"POST","headers":{"Content-Type":"application/json"},"body":{...}}`

### 2. `fetch` Command (Runtime)

- **Input**: JSON string (from `_JSON`)
- **Process**:
  1. Parses input with `yaml.parse()` to get config object
  2. **Critical Fix**: If `body` is object + Content-Type is `application/json`, stringify the body
  3. Calls native `fetch(url, config)`
- **Output**: Response body as `Readable` stream
- **Key Insight**: Native `fetch()` expects `body` to be a string for JSON requests, not an object

### 3. `tee` Command

- **Input**: Any `string | Readable`
- **Process**: Outputs trimmed input to stdout via `process.stdout.write()`
- **Output**: Passes original untrimmed input forward unchanged
- **Purpose**: Debugging and monitoring pipeline data flow

### 4. `jp` Command (JSONPath)

- **Input**: JSON string or `Readable` containing JSON
- **Process**: Executes JSONPath query using external `jp` command
- **Output**: Extracted value as string, or `null` if no match
- **Error Case**: Returns `null` for failed queries (e.g., API error responses)

### 5. `unquote` Command

- **Input**: JSON-quoted string (e.g., `"Hello World"`)
- **Process**: Calls `JSON.parse()` to remove quotes
- **Output**: Unquoted string content
- **Failure**: Throws "input is null" when input is `null` from failed JSONPath

## Type Contract Enforcement

The runtime validates type contracts after each command execution:

- **Valid Types**: `string` or Node.js `Readable` stream
- **Invalid Types**: Objects, arrays, numbers, booleans
- **Error**: `"runCommands: internal error, invalid resulting input type; object"`

## Stream Processing Patterns

### String-to-Stream Conversion

- Commands use `readableToString(input)` when string processing is required
- `Readable.fromWeb()` converts web streams (like fetch responses) to Node.js streams

### Pass-Through Semantics

- Many commands perform side effects while preserving pipeline flow
- `tee`: outputs to stdout, passes input forward
- `print`: similar to tee but with different formatting
- Side-effect commands maintain pipeline integrity

## Error Propagation

### API Error Responses

- HTTP APIs return valid JSON even for errors: `{"error":{"message":"..."}}`
- Pipeline continues processing error responses as normal data
- JSONPath queries on error responses return `null`
- Downstream commands fail when receiving `null` input

### Command Failure Stack Traces

- Runtime generates detailed execution context with command numbering
- Failure point marked with `> command <` syntax
- Shows complete argument list for debugging
- Multiple nested contexts for macro invocations

## Macro System Integration

### Argument Substitution

- `$arg: N` placeholders resolved during macro execution
- `_RAW` directive inlines command sequences for parameter substitution
- Context-based argument resolution via stack-based contexts

### Execution Contexts

- Macros create isolated execution contexts with argument binding
- Context cleanup handled automatically via try/finally blocks
- Nested macro invocations supported through context stacking

## Debugging Techniques

### Pipeline Inspection

1. **Add `tee` commands** at any point to see intermediate values
2. **Check API responses directly** with curl to verify expected format
3. **Examine argument parsing** with spam-level logging
4. **Validate `_JSON` output** by testing components individually

### Common Failure Patterns

- **"input is null"**: JSONPath query returned no results (often due to API errors)
- **"invalid resulting input type"**: Command returned wrong type (object instead of string/Readable)
- **Fetch errors**: Usually body serialization issues (object vs string)

## Key Architectural Insights

1. **No Magic**: The system is deterministic - data flows exactly as specified
2. **Type Safety**: Runtime enforces contracts, compile-time validation is minimal
3. **Stream-First**: Designed for processing large data without memory constraints
4. **Error Transparency**: Failed API calls produce valid pipeline data (error objects)
5. **Debugging-Friendly**: `tee` commands provide complete visibility into data flow

## Additional Debugging Insights

### Error Stacktrace vs Actual Data

- **Error stacktraces show command sequences**, not actual data values
- The numbered command list in error output represents the execution plan, not data content
- **Always trust `tee` output over error traces** for understanding data flow
- Example: `14: $arg,2` in stacktrace doesn't mean literal `$arg,2` - it shows the command structure

### YAML vs JSON Parsing Duality

- `fetch` command uses `yaml.parse()` on JSON strings (YAML is JSON superset)
- This allows flexible input formats but can mask type issues
- The parser correctly handles JSON strings as valid YAML input
- **Implication**: JSON and YAML are interchangeable in the pipeline input layer

### Native API Integration Patterns

- **Web APIs expect specific data formats** that may differ from internal representations
- `fetch()` body serialization is a common integration point requiring special handling
- **Pattern**: Check Content-Type headers to determine required serialization
- Similar issues likely exist with other native API integrations

### Macro System Execution Timing

- `_JSON` processing happens at **compilation time** (script loading)
- `$arg` resolution happens at **runtime** (macro execution)
- `_RAW` directive bridges this gap by inlining commands during compilation
- **Critical**: Understanding compilation vs runtime phases prevents confusion about when data transformations occur

### HTTP Error Response Handling

- APIs return **structurally valid JSON for both success and error cases**
- Error responses have different schemas: `{"error": {...}}` vs `{"choices": [...]}`
- Pipeline continues processing errors as normal data (no exceptions thrown)
- **Design Decision**: Error handling is data-driven, not exception-driven

### Command Description Accuracy

- `fetch` command description says "with input as request body" but it actually uses input as **request configuration**
- Documentation can lag behind implementation changes
- **Best Practice**: Trust implementation over documentation when debugging

### Development Workflow Implications

- **Add debugging `tee` commands liberally** during development
- Remove debug commands only after confirming the fix works
- **Test with actual external services** (like Ollama) to catch integration issues
- Error messages from external services often provide the clearest diagnostic information

This pipeline architecture enables complex data processing workflows while maintaining predictable behavior and
excellent debuggability.
