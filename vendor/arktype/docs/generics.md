---
title: 'Generics'
source: https://arktype.io/docs/generics
url: https://arktype.io/docs/generics
---

[📈 Announcing ArkType 2.1 📈](https://arktype.io/docs/blog/2.1)

# Generics

### [Keywords](https://arktype.io/docs/generics#keywords)

This table includes all generic keywords available in default `type` API.

| Alias    | Description                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------ | ------ | -------------- |
| Exclude  | exclude branches of a union like `Exclude("boolean", "true")`                                                |
| Extract  | extract branches of a union like `Extract("0                                                                 | false  | 1", "number")` |
| Merge    | merge an object's properties onto another like `Merge(User, { isAdmin: "true" })`                            |
| Omit     | omit a set of properties from an object like `Omit(User, "age")`                                             |
| Partial  | make all named properties of an object optional like `Partial(User)`                                         |
| Pick     | pick a set of properties from an object like `Pick(User, "name                                               | age")` |
| Record   | instantiate an object from an index signature and corresponding value type like `Record("string", "number")` |
| Required | make all named properties of an object required like `Required(User)`                                        |

### [Syntax](https://arktype.io/docs/generics#syntax)

Generics can be declared and instantiated in one of three ways.

#### [Definition](https://arktype.io/docs/generics#definition)

```
import { type } from "arktype"

const boxOf = type("<t>", { box: "t" })

// hover me!
const schrodingersBox = boxOf({ cat: { isAlive: "boolean" } })
```

#### [Constrained Parameters](https://arktype.io/docs/generics#constrained-parameters)

All syntax in parameters definitions and all references to generic args are fully-type safe and autocompleted like any
built-in keyword. Constraints can be used just like TS to limit what can be passed to a generic and allow that arg to be
used with operators like `>`.

```
import { type } from "arktype"

const nonEmpty = type("<arr extends unknown[]>", "arr > 0")

const nonEmptyNumberArray = nonEmpty("number[]")
```

#### [Scoped](https://arktype.io/docs/generics#scoped)

There is a special syntax for specifying generics in a scope:

```
import { scope } from "arktype"

const types = scope({
 "box<t, u>": {
  box: "t | u"
 },
 bitBox: "box<0, 1>"
}).export()

const out = types.bitBox({ box: 0 })
```

#### [Invocation](https://arktype.io/docs/generics#invocation)

```
import { type } from "arktype"

const One = type("Extract<0 | 1, 1>")
```

##### [Chained](https://arktype.io/docs/generics#chained)

```
import { type } from "arktype"

const User = type({
 name: "string",
 "age?": "number",
 isAdmin: "boolean"
})

// hover me!
const basicUser = User.pick("name", "age")
```

#### [Invoked](https://arktype.io/docs/generics#invoked)

```
import { type } from "arktype"

const unfalse = type.keywords.Exclude("boolean", "false")
```

### [HKT](https://arktype.io/docs/generics#hkt)

Our new generics have been built using a new method for integrating arbitrary external types as native ArkType generics!
This opens up tons of possibilities for external integrations that would otherwise not be possible. As a preview, here's
what the implementation of `Partial` looks like internally:

```
import { generic, Hkt } from "arktype"

const Partial = generic(["T", "object"])(
 args => args.T.partial(),
 class PartialHkt extends Hkt<[object]> {
  declare body: Partial<this[0]>
 }
)
```

Recursive and cyclic generics are also currently unavailable and will be added soon.

For more usage examples, check out the unit tests for generics
[here](https://github.com/arktypeio/arktype/blob/main/ark/type/__tests__/generic.test.ts).

### [External](https://arktype.io/docs/generics#external)

The most basic pattern for wrapping a Type looks something like this:

```
const createBox = <t extends string>(of: type.Any<t>) =>
 type({
  box: of
 })

// @ts-expect-error
createBox(type("number"))

// Type<{ box: string }>
const BoxType = createBox(type("string"))
```

For a deeper integration, you may wish to parse a definition directly:

```
const createBox = <const def>(
 of: type.validate<def>
): type.instantiate<{ of: def }> =>
 type.raw({
  box: of
 }) as never

// Type<{ box: string }>
const BoxType = createBox("string")
```

The sky's the limit when it comes to this sort of integration, but be warned- TypeScript generics are notoriously
finicky and
[you may find APIs like these difficult to write if you're not used to it](https://arktype.io/docs/faq#why-isnt-my-wrapper-generic-working).

[thunks\\ \\ Previous Page](https://arktype.io/docs/scopes#thunks)
[keywords\\ \\ Next Page](https://arktype.io/docs/generics#keywords)

### On this page

[Keywords](https://arktype.io/docs/generics#keywords) [Syntax](https://arktype.io/docs/generics#syntax)
[Definition](https://arktype.io/docs/generics#definition)
[Constrained Parameters](https://arktype.io/docs/generics#constrained-parameters)
[Scoped](https://arktype.io/docs/generics#scoped) [Invocation](https://arktype.io/docs/generics#invocation)
[Chained](https://arktype.io/docs/generics#chained) [Invoked](https://arktype.io/docs/generics#invoked)
[HKT](https://arktype.io/docs/generics#hkt) [External](https://arktype.io/docs/generics#external)
