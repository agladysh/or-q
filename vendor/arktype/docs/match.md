---
title: 'Match'
source: https://arktype.io/docs/match
url: https://arktype.io/docs/match
---

[📈 Announcing ArkType 2.1 📈](https://arktype.io/docs/blog/2.1)

# Match

The `match` function provides a powerful way to handle different types of input and return corresponding outputs based
on the input type, like a type-safe `switch` statement.

## [Case Record API](https://arktype.io/docs/match#case-record-api)

The simplest way to define a matcher is with ArkType definition strings as keys with corresponding handlers as values:

```
import { match } from "arktype"

const sizeOf = match({
 "string | Array": v => v.length,
 number: v => v,
 bigint: v => v,
 default: "assert"
})

// a match definition is complete once a `default` has been specified,
// either as a case or via the .default() method

sizeOf("abc") // 3
sizeOf([1, 2, 3, 4]) // 4
sizeOf(5n) // 5n
// ArkErrors: must be an object, a string, a number or a bigint (was boolean)
sizeOf(true)
```

In this example, `sizeOf` is a matcher that takes a string, array, number, or bigint as input. It returns the length of
strings and arrays, and the value of numbers and bigints.

`default` accepts one of 4 values:

- `"assert"`: accept `unknown`, throw if none of the cases match
- `"never"`: accept an input based on inferred cases, throw if none match
- `"reject"`: accept `unknown`, return `ArkErrors` if none of the cases match
- `(data: In) => unknown`: handle data not matching other cases directly

Cases will be checked in the order they are specified, either as object literal keys or via chained methods.

## [Fluent API](https://arktype.io/docs/match#fluent-api)

The `match` function also provides a fluent API. This can be convenient for non-string-embeddable definitions:

```
import { match } from "arktype"

// the Case Record and Fluent APIs can be easily combined
const sizeOf = match({
 string: v => v.length,
 number: v => v,
 bigint: v => v
})
 // match any object with a numeric length property and extract it
 .case({ length: "number" }, o => o.length)
 // return 0 for all other data
 .default(() => 0)

sizeOf("abc") // 3
sizeOf({ name: "David", length: 5 }) // 5
sizeOf(null) // 0
```

## [Narrowing input with `in`, property matching with `at`](https://arktype.io/docs/match#narrowing-input-with-in-property-matching-with-at)

```
import { match } from "arktype"

type Data =
 | {
   id: 1
   oneValue: number
   }
 | {
   id: 2
   twoValue: string
   }

const discriminateValue = match
 // .in allows you to specify the input TypeScript allows for your matcher
 .in<Data>()
 // .at allows you to specify a key at which your input will be matched
 .at("id")
 .match({
  1: o => `${o.oneValue}!`,
  2: o => o.twoValue.length,
  default: "assert"
 })

discriminateValue({ id: 1, oneValue: 1 }) // "1!"
discriminateValue({ id: 2, twoValue: "two" }) // 3
discriminateValue({ oneValue: 3 })
TypeScript:   Property 'id' is missing in type '{ oneValue: number; }' but required in type '{ id: 1; oneValue: number; }'.
```

[this\\ \\ Previous Page](https://arktype.io/docs/expressions#this)
[Configuration\\ \\ Next Page](https://arktype.io/docs/configuration)

### On this page

[Case Record API](https://arktype.io/docs/match#case-record-api) [Fluent API](https://arktype.io/docs/match#fluent-api)
[Narrowing input with `in`, property matching with `at`](https://arktype.io/docs/match#narrowing-input-with-in-property-matching-with-at)
