---
title: 'Configuration'
source: https://arktype.io/docs/configuration
url: https://arktype.io/docs/configuration
---

[📈 Announcing ArkType 2.1 📈](https://arktype.io/docs/blog/2.1)

# Configuration

A great out-of-the-box experience is a core goal of ArkType, including safe defaults and helpful messages for complex
errors.

However, it's equally important that when you need different behavior, you can easily configure it with the right
granularity.

### [Levels](https://arktype.io/docs/configuration#levels)

| Level       | Applies To                                            | Example                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **default** | built-in defaults for all Types                       |                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **global**  | all Types parsed after the config is applied          | config.ts<br>`<br>import { configure } from "arktype/config"<br>// use the "arktype/config" entrypoint<br>configure({ numberAllowsNaN: true })<br>`<br>app.ts<br>`<br>import "./config.ts"<br>// import your config file before arktype<br>import { type } from "arktype"<br>type.number.allows(Number.NaN) // true<br>`                                                                                                                                                  |
| **scope**   | all Types parsed in the configured Scope              | `<br>const myScope = scope(<br> { User: { age: "number < 100" } },<br> {<br>  max: {<br>   actual: () => "unacceptably large"<br>  }<br> }<br>)<br>const types = myScope.export()<br>// ArkErrors: age must be less than 100 (was unacceptably large)<br>types.User({ name: "Alice", age: 101 })<br>const parsedAfter = myScope.type({<br> age: "number <= 100"<br>})<br>// ArkErrors: age must be at most 100 (was unacceptably large)<br>parsedAfter({ age: 101 })<br>` |
| **type**    | all Types shallowly referenced by the configured Type | `<br>// avoid logging "was xxx" for password<br>const Password = type("string >= 8").configure({ actual: () => "" })<br>const User = type({<br> email: "string.email",<br> password: Password<br>})<br>// ArkErrors: password must be at least length 8<br>const out = User({<br> email: "david@arktype.io",<br> password: "ez123"<br>})<br>`                                                                                                                             |

Some options only apply at specific levels, as reflected in the corresponding input types.

Use the \`"arktype/config"\` entrypoint in a separate file for global config!

If you need your config to apply to built-in keywords (important for options like `jitless`, `numberAllowsNaN`,
`dateAllowsInvalid`), you should import and `configure` from `"arktype/config"` before importing anything from
`"arktype"`.

Otherwise, keywords will have already been parsed by the time your config applies!

### [Errors](https://arktype.io/docs/configuration#errors)

To allow custom errors to be integrated seemlessly with built-in logic for composite errors (i.e. `union` and
`intersection`), ArkType supports a set of composable options:

| optional        | description                                                                                                                                                                                                                                | example                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **description** | ✅ a summary of the constraint that could complete the phrase "must be \_\_\_"<br>🥇 reused by other metadata and should be your first go-to for customizing a message                                                                     | `<br>const Password = type.string.atLeastLength(8).describe("a valid password")<br>// ArkErrors: must be a valid password<br>const out = Password("ez123")<br>`                                                                                                                                                                                                                          |
| **expected**    | ✅ a function accepting the error context and returning a string of the format "must be \_\_\_"<br>✅ specific to errors and takes precedence over `description` in those cases                                                            | ``<br>const Password = type.string.atLeastLength(8).configure({<br> expected: ctx =><br>  ctx.code === "minLength" ? `${ctx.rule} characters or better` : "way better"<br>})<br>// ArkErrors: must be 8 characters or better (was 5)<br>const out1 = Password("ez123").toString()<br>// ArkErrors: must be way better (was a number)<br>const out2 = Password(12345678).toString()<br>`` |
| **actual**      | ✅ a function accepting the data that caused the error and returning a string of the format "(was \_\_\_)"<br>✅ if an empty string is returned, the actual portion of the message will be omitted                                         | `<br>const Password = type("string >= 8").configure({ actual: () => "" })<br>// ArkErrors: must be at least length 8<br>const out = Password("ez123")<br>`                                                                                                                                                                                                                               |
| **problem**     | ✅ a function accepting the results of `expected` and `actual` in addition to other context and returning a complete description of the problem like "must be a string (was a number)"<br>❌ may not apply to composite errors like unions | ``<br>const Password = type("string >= 8").configure({<br> problem: ctx => `${ctx.actual} isn't ${ctx.expected}`<br>})<br>// ArkErrors: 5 isn't at least length 8<br>const out1 = Password("ez123")<br>// ArkErrors: a number isn't a string<br>const out2 = Password(12345678)<br>``                                                                                                    |
| **message**     | ✅ a function accepting the result of `problem` in addition to other context and returning a complete description of the problem including the path at which it occurred<br>❌ may not apply to composite errors like unions               | ```<br>const User = type({<br> password: "string >= 8"<br>}).configure({<br> message: ctx =><br>  `${ctx.propString                                                                                                                                                                                                                                                                      |     | "(root)"}: ${ctx.actual} isn't ${ctx.expected}`<br>})<br>// ArkErrors: (root): a string isn't an object<br>const out1 = User("ez123")<br>// `.configure` only applies shallowly, so the nested error isn't changed!<br>// ArkErrors: password must be at least length 8 (was 5)<br>const out2 = User({ password: "ez123" })<br>``` |

#### [By Code](https://arktype.io/docs/configuration#by-code)

Errors can also be configured by their associated `code` property at a _scope_ or _global_ level.

For example:

```
const mod = type.module(
 { isEven: "number%2" },
 {
  divisor: {
   // the available `ctx` types will include data specific to your errors
   expected: ctx => `% ${ctx.rule} !== 0`,
   problem: ctx => `${ctx.actual} ${ctx.expected}`
  }
 }
)
// ArkErrors: 3 % 2 !== 0
mod.isEven(3)
```

#### [ArkErrors](https://arktype.io/docs/configuration#arkerrors)

For use cases like i18n that fall outside the scope of this composable message config, the `ArkErrors` array returned on
validation failure contains `ArkError` instances that can be discriminated via calls like `.hasCode("divisor")` and
contain contextual data specific to that error type as well as getters for each composable error part.

These `ArkError` instances can be arbitrarily transformed and composed with an internationalization library. This is
still a topic we're working on investigating and documenting, so please reach out with any questions or feedback!

### [Keywords](https://arktype.io/docs/configuration#keywords)

Built-in keywords like `string.email` can be globally configured.

This can be very helpful for customizing error messages without needing to create your own aliases or wrappers.

config.ts

```
import { configure } from "arktype/config"

configure({
 keywords: {
  string: "shorthand description",
  "string.email": {
   actual: () => "definitely fake"
  }
 }
})
```

app.ts

```
import "./config.ts"
// import your config file before arktype
import { type } from "arktype"

const User = type({
 name: "string",
 email: "string.email"
})

const out = User({
 // ArkErrors: name must be shorthand description (was a number)
 name: 5,
 // ArkErrors: email must be an email address (was definitely fake)
 email: "449 Canal St"
})
```

The options you can provide here are identical to those used to
[configure a Type directly](https://arktype.io/docs/expressions#meta), and can also be
[extended at a type-level to include custom metadata](https://arktype.io/docs/configuration#custom).

### [Clone](https://arktype.io/docs/configuration#clone)

By default, before a [morph](https://arktype.io/docs/intro/morphs-and-more) is applied, ArkType will deeply clone the
original input value with a built-in `deepClone` function that tries to make reasonable assumptions about preserving
prototypes etc. The implementation of `deepClone` can be found
[here](https://github.com/arktypeio/arktype/blob/main/ark/util/clone.ts).

You can provide an alternate clone implementation to the `clone` config option.

config.ts

```
import { configure } from "arktype/config"

configure({ clone: structuredClone })
```

app.ts

```
import "./config.ts"
// import your config file before arktype
import { type } from "arktype"

// will now create a new object using structuredClone
const UserForm = type({
 age: "string.numeric.parse"
})
```

To mutate the input object directly, you can set the `clone` config option to `false`.

config.ts

```
import { configure } from "arktype/config"

configure({ clone: false })
```

app.ts

```
import "./config.ts"
// import your config file before arktype
import { type } from "arktype"

const UserForm = type({
 age: "string.numeric.parse"
})

const formData = {
 age: "42"
}

const out = UserForm(formData)

// the original object's age key is now a number
console.log(formData.age)
```

### [onUndeclaredKey](https://arktype.io/docs/configuration#onundeclaredkey)

Like TypeScript, ArkType defaults to ignoring undeclared keys during validation. However, it also supports two
additional behaviors:

- `"ignore"` (default): Allow undeclared keys on input, preserve them on output
- `"delete"`: Allow undeclared keys on input, delete them before returning output
- `"reject"`: Reject input with undeclared keys

These behaviors can be associated with individual Types via the built-in `"+"` syntax (see
[those docs](https://arktype.io/docs/objects#properties-undeclared) for more on how they work). You can also change the
default globally:

config.ts

```
import { configure } from "arktype/config"

configure({ onUndeclaredKey: "delete" })
```

app.ts

```
import "./config.ts"
// import your config file before arktype
import { type } from "arktype"

const UserForm = type({
 name: "string"
})

// out is now { name: "Alice" }
const out = UserForm({
 name: "Alice",
 age: "42"
})
```

### [exactOptionalPropertyTypes](https://arktype.io/docs/configuration#exactoptionalpropertytypes)

By default, ArkType validates optional keys as if
[TypeScript's `exactOptionalPropertyTypes` is set to `true`](https://www.typescriptlang.org/tsconfig/#exactOptionalPropertyTypes).

See an example

```
const MyObj = type({
 "key?": "number"
})

// valid data
const validResult = MyObj({})

// Error: key must be a number (was undefined)
const errorResult = MyObj({ key: undefined })
```

This approach allows the most granular control over optionality, as `| undefined` can be added to properties that should
accept it.

However, if you have not enabled TypeScript's `exactOptionalPropertyTypes` setting, you may globally configure ArkType's
`exactOptionalPropertyTypes` to `false` to match TypeScript's behavior. If you do this, we'd recommend making a plan to
enable `exactOptionalPropertyTypes` in the future.

config.ts

```
import { configure } from "arktype/config"

// since the default in ArkType is `true`, this will only have an effect if set to `false`
configure({ exactOptionalPropertyTypes: false })
```

app.ts

```
import "./config.ts"
// import your config file before arktype
import { type } from "arktype"

const MyObj = type({
 "key?": "number"
})

// valid data
const validResult = MyObj({})

// now also valid data (would be an error by default)
const secondResult = MyObj({ key: undefined })
```

exactOptionalPropertyTypes does not yet affect default values!

```
const MyObj = type({
 key: "number = 5"
})

// { key: 5 }
const omittedResult = MyObj({})

// { key: undefined }
const undefinedResult = MyObj({ key: undefined })
```

Support for this is tracked as part of
[this broader configurable defaultability issue](https://github.com/arktypeio/arktype/issues/1390).

### [jitless](https://arktype.io/docs/configuration#jitless)

By default, when a `Type` is instantiated, ArkType will precompile optimized validation logic that will run when the
type is invoked. This behavior is disabled by default in environments that don't support `new Function`, e.g. Cloudflare
Workers.

If you'd like to opt out of it for another reason, you can set the `jitless` config option to `true`.

config.ts

```
import { configure } from "arktype/config"

configure({ jitless: true })
```

app.ts

```
import "./config.ts"
// import your config file before arktype
import { type } from "arktype"

// will not be precompiled
const MyObject = type({
 foo: "string"
})
```

### [onFail](https://arktype.io/docs/configuration#onfail)

In some domains, you may always want to throw on failed validation or transform the result in some other way.

By specifying `onFail` in your global config, you can control what happens when you invoke a `Type` on invalid data:

config.ts

```
import { configure } from "arktype/config"

const config = configure({
 onFail: errors => errors.throw()
})

// be sure to specify both the runtime and static configs

declare global {
 interface ArkEnv {
  onFail: typeof config.onFail
 }
}
```

app.ts

```
import "./config.ts"
// import your config file before arktype
import { type } from "arktype"

// data is inferred as string- no need to discriminate!
const data = type.string("foo")

// now thrown instead of returned
// ArkErrors: must be a string (was number)
const bad = type.string(5)
```

### [metadata](https://arktype.io/docs/configuration#metadata)

Additional arbitrary metadata can also be associated with a Type.

It can even be made type-safe via an interface extension ArkType exposes for this purpose:

```
// add this anywhere in your project
declare global {
 interface ArkEnv {
  meta(): {
   // meta properties should always be optional
   secretIngredient?: string
  }
 }
}

// now types you define can specify and access your metadata
const MrPingsSecretIngredientSoup = type({
 broth: "'miso' | 'vegetable'",
 ingredients: "string[]"
}).configure({ secretIngredient: "nothing!" })
```

### [toJsonSchema](https://arktype.io/docs/configuration#tojsonschema)

Some ArkType features don't have JSON Schema equivalents. By default, `toJsonSchema()` will throw in these cases.

This behavior can be configured granularly to match your needs.

```
const T = type({
 "[symbol]": "string",
 birthday: "Date"
})

const schema = T.toJsonSchema({
 fallback: {
  // ✅ the "default" key is a fallback for any non-explicitly handled code
  // ✅ ctx includes "base" (represents the schema being generated) and other code-specific props
  // ✅ returning `ctx.base` will effectively ignore the incompatible constraint
  default: ctx => ctx.base,
  // handle specific incompatibilities granularly
  date: ctx => ({
   ...ctx.base,
   type: "string",
   format: "date-time",
   description: ctx.after ? `after ${ctx.after}` : "anytime"
  })
 }
})

const result = {
 $schema: "https://json-schema.org/draft/2020-12/schema",
 type: "object",
 properties: {
  // Date instance is now a date-time string as specified by the `date` handler
  birthday: { type: "string", format: "date-time", description: "anytime" }
 },
 required: ["birthday"]
 // symbolic index signature ignored as specified by the `default` handler
}
```

a `default` handler can also be specified at the root of a `fallback` config:

```
const T = type({
 "[symbol]": "string",
 birthday: "Date"
})

//--- cut ---

const schema = T.toJsonSchema({
 // "just make it work"
 fallback: ctx => ctx.base
})
```

These options can also be set at a [global or scope-level](https://arktype.io/docs/configuration#levels).

### [Fallback Codes](https://arktype.io/docs/configuration#fallback-codes)

This is the full list of configurable reasons `toJsonSchema()` can fail.

| Code                  | Description                                                 |
| --------------------- | ----------------------------------------------------------- |
| `arrayObject`         | arrays with object properties                               |
| `arrayPostfix`        | arrays with postfix elements                                |
| `defaultValue`        | non-serializable default value                              |
| `domain`              | non-serializable type keyword (always `bigint` or `symbol`) |
| `morph`               | transformation                                              |
| `patternIntersection` | multiple regex constraints                                  |
| `predicate`           | custom narrow function                                      |
| `proto`               | non-serializable `instanceof`                               |
| `symbolKey`           | symbolic key on an object                                   |
| `unit`                | non-serializable `===` reference (e.g. `undefined`)         |
| `date`                | a Date instance (supercedes `proto` for Dates )             |

### [prototypes](https://arktype.io/docs/configuration#prototypes)

When you `.infer` your Types, ArkType traverses them and extracts special values like morphs, e.g.
`(In: string) => Out<number>`.

Though generally this is able to preserve the original type, it is inefficient and can accidentally expand certain
object types.

You can use the type-level `prototypes` config to tell ArkType to treat those types as external:

```
declare global {
 interface ArkEnv {
  prototypes(): MySpecialClass
 }
}

class MySpecialClass {}

const

const T: Type<MySpecialClass, {}>T = type.instanceOf(MySpecialClass)

```

[Match\\ \\ Previous Page](https://arktype.io/docs/match)
[levels\\ \\ Next Page](https://arktype.io/docs/configuration#levels)
