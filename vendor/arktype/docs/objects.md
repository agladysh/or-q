---
title: 'Objects'
source: https://arktype.io/docs/objects
url: https://arktype.io/docs/objects
---

[📈 Announcing ArkType 2.1 📈](https://arktype.io/docs/blog/2.1)

# Objects

## [properties](https://arktype.io/docs/objects#properties)

Objects definitions can include any combination of required, optional, defaultable named properties and index
signatures.

### [required](https://arktype.io/docs/objects#properties-required)

stringfluent

```
const symbolicKey = Symbol()

const MyObj = type({
 requiredKey: "string",
 // Nested definitions don't require additional `type` calls!
 [symbolicKey]: {
  nested: "unknown"
 }
})
```

### [optional](https://arktype.io/docs/objects#properties-optional)

stringfluenttuple

```
const symbolicKey = Symbol()

const MyObj = type({
 "optionalKey?": "number[]",
 [symbolicKey]: "string?"
})
```

Should I use key or value syntax for optionality?

Optionality can either be expressed on the key or the corresponding value.

We recommend using the key syntax by default because...

- it mirrors TypeScript
- it better reflects a _key presence_ constraint that has no effect on allowed values

However, there are a few reasons you might want to use a value-embedded syntax:

1. The key is a symbol (makes key-embedded syntax impossible)
2. You want editor features like JSDoc and go-to-definition for the key (can't work if the key name changes)
3. You really hate having to quote key names

Optional properties cannot be present with the value undefined

In TypeScript, there is a setting called
[`exactOptionalPropertyTypes`](https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes) that can be set to
`true` to enforce the distinction between properties that are missing and properties that are present with the value
`undefined`.

ArkType mirrors this behavior by default, so if you want to allow `undefined`, you'll need to add it to your value's
definition. Though not recommended as a long-term solution, you may also
[globally configure `exactOptionalPropertyTypes`](https://arktype.io/docs/configuration#exactoptionalpropertytypes) to
`false`.

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

### [defaultable](https://arktype.io/docs/objects#properties-defaultable)

stringfluenttuple

```
const MyObj = type({
 defaultableKey: "boolean = false"
})
```

Optional and default only work within objects and tuples!

Unlike e.g. `number.array()`, `number.optional()` and `number.default(0)` don't return a new `Type`, but rather a tuple
definition like `[Type<number>, "?"]` or `[Type<number>, "=", 0]`.

This reflects the fact that in ArkType's type system, optionality and defaultability are only meaningful in reference to
a property. Attempting to create an optional or defaultable value outside an object like `type("string?")` will result
in a `ParseError`.

To create a `Type` accepting `string` or `undefined`, use a union like `type("string | undefined")`.

To have it transform `undefined` to an empty string, use an explicit morph like:

```
const FallbackString = type("string | undefined").pipe(v => v ?? "")
```

### [index](https://arktype.io/docs/objects#properties-index)

string

```
const MyObj = type({
 // index signatures do not require a label
 "[string]": "number.integer",
 // arbitrary string or symbolic expressions are allowed
 "[string | symbol]": "number"
})
```

### [undeclared](https://arktype.io/docs/objects#properties-undeclared)

TypeScript's structural type system explicitly allows assigning objects with additional keys so long as all declared
constraints are satisfied. ArkType mirrors this behavior by default because generally...

- Existing objects can be reused more often.
- Validation is much more efficient if you don't need to check for undeclared keys.
- Extra properties don't usually matter as long as those you've declared are satisfied.

However, sometimes the way you're using the object would make undeclared properties problematic. Even though they can't
be reflected by TypeScript (
[_yet_\- please +1 the issue!](https://github.com/microsoft/TypeScript/issues/12936#issuecomment-1854411301)), ArkType
_does_ support rejection or deletion of undeclared keys. This behavior can be defined for individual objects using the
syntax below or [via configuration](https://arktype.io/docs/configuration#undeclared) if you want to change the default
across all objects.

stringfluent

```
// fail if any key other than "onlyAllowedKey" is present
const MyClosedObject = type({
 "+": "reject",
 onlyAllowedKey: "string"
})

// delete all non-symbolic keys other than "onlyPreservedStringKey"
const MyStrippedObject = type({
 "+": "delete",
 "[symbol]": "unknown",
 onlyPreservedStringKey: "string"
})

// allow and preserve undeclared keys (the default behavior)
const MyOpenObject = type({
 // only specify "ignore" if you explicitly configured the default elsewhere
 "+": "ignore",
 nonexclusiveKey: "number"
})
```

### [spread](https://arktype.io/docs/objects#properties-spread)

The **spread operator** is great for merging sets of properties. When applied to two distinct (i.e. non-overlapping)
sets of properties, it is equivalent to [intersection](https://arktype.io/docs/expressions#intersection). However, if a
key appears in both the base and merged objects, the base value will be discarded in favor of the merged rather than
recursively intersected.

Spreading bypasses a lot of the behavioral complexity and computational overhead of an intersection and should be the
preferred method of combining property sets.

A base object definition can be spread if `"..."` is the first key specified in an object literal. Subsequent properties
will be merged into those from the base object, just like the `...` operator
[in JS](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax).

```
const User = type({ isAdmin: "false", name: "string" })

// hover to see the newly merged object
const Admin = type({
 "...": User,
 // in an intersection, non-overlapping values at isAdmin would result in a ParseError
 isAdmin: "true",
 permissions: "string[]"
})
```

The spread operator is semantically equivalent to the generic `Merge` keyword, which can be instantiated via a dedicated
method on `Type` in addition to the standard keyword syntax.

stringfluentfunction

```
const types = type.module({
 base: {
  "foo?": "0",
  "bar?": "0"
 },
 merged: {
  bar: "1",
  "baz?": "1"
 },
 result: "Merge<base, merged>"
})

// hover to see the inferred result
type Result = typeof types.result.infer
```

### [keyof](https://arktype.io/docs/objects#properties-keyof)

Like in TypeScript, the `keyof` operator extracts the keys of an object as a union:

fluentstringtupleargs

```
const UsedCar = type({
 originallyPurchased: "string.date",
 remainingWheels: "number"
})

const UsedCarKey = UsedCar.keyof()

type UsedCarKey = typeof UsedCarKey.infer
```

Also like in TypeScript, if an object includes an index signature like `[string]` alongside named properties, the union
from `keyof` will reduce to `string`:

```
const RecordWithSpecialKeys = type({
 "[string]": "unknown",
 verySpecialKey: "0 < number <= 3.14159",
 moderatelySpecialKey: "-9.51413 <= number < 0"
})

// in a union with the `string` index signature, string literals
// "verySpecialKey" and "moderatelySpecialKey" are redundant and will be pruned
const Key = RecordWithSpecialKeys.keyof()

// key is identical to the base `string` Type
console.log(Key.equals("string"))
```

ArkType's \`keyof\` will never include \`number\`

Though TypeScript's `keyof` operator can yield a `number`, the concept of numeric keys does not exist in JavaScript at
runtime. This leads to confusing and inconsistent behavior. In ArkType, `keyof` will always return a `string` or
`symbol` in accordance with the construction of a JavaScript object.

Learn more about our motivation for diverging from TypeScript on this issue

In JavaScript, you can use a number literal to define a key, but the constructed value has no way to represent a numeric
key, so it is coerced to a string.

```
const numberLiteralObj = {
 4: true,
 5: true
}

const stringLiteralObj = {
 "4": true,
 "5": true
}

// numberLiteralObj and stringLiteralObj are indistinguishable at this point
Object.keys(numberLiteralObj) // ["4", "5"]
Object.keys(stringLiteralObj) // ["4", "5"]
```

For a set-based type system to be correct, any two types representing the same set of underlying values must share a
single representation. TypeScript's decision to have distinct numeric and string representations for the same underlying
key has led to some if its most confusing inference pitfalls:

```
type Thing1 = {
 [x: string]: unknown
}

// Thing2 is apparently identical to Thing1
type Thing2 = Record<string, unknown>

// and yet...
type

type Key1 = string | numberKey1 = keyof Thing1

type

type Key2 = stringKey2 = keyof Thing2

```

This sort of inconsistency is inevitable for a type system that has to reconcile multiple representations for identical
sets of underlying values. Therefore, numeric keys are one of a handful of cases where ArkType intentionally diverges
from TypeScript. ArkType will never return a `number` from `keyof`. Keys will always be normalized to a `string` or
`symbol`, the two distinct property types that can be uniquely attached to a JavaScript object.

### [get](https://arktype.io/docs/objects#properties-get)

Like an index access expression in TypeScript (e.g. `User["name"]`), the `get` operator extracts the Type of a value
based on a specified key definition from an object:

```
const snorfUsage = type.enumerated("eating plants", "looking adorable")

const Manatee = type({
 isFriendly: "true",
 snorf: {
  uses: snorfUsage.array()
 }
})

const True = Manatee.get("isFriendly")

// nested properties can be accessed directly by passing additional args
const SnorfUses = Manatee.get("snorf", "uses")
```

Expressions like \`get\` and \`omit\` that extract a portion of an exising Type can be an antipattern!

Before using `get` to extract the type of a property you've defined, consider whether you may be able to define the
property value directly as a standalone Type that can be easily referenced and composed as needed.

Usually, composing Types from the bottom up is clearer and more efficient than trying to rip the part you need out of an
existing Type.

Though cases like this are quite straightforward, there are number of more nuanced behaviors to consider when accessing
an arbitrary key that could be a union, literal, or index signature on an object Type that could also be a union
including optional keys or index signatures.

If you're interested in a deeper dive into this (or anything else in ArkType),
[our unit tests](https://github.com/arktypeio/arktype/blob/main/ark/type/__tests__/get.test.ts) are the closest thing we
have to a comprehensive spec.

Not your cup of tea? No worries- the inferred types and errors you'll see in editor will always be guiding you in the
right direction 🧭

Support for TypeScript's index access syntax is planned!

Leave a comment on [the\\ issue](https://github.com/arktypeio/arktype/issues/831) letting us know if you're interested
in using- or even helping implement- type-level parsing for string-embedded index access 🤓

## [arrays](https://arktype.io/docs/objects#arrays)

stringfluenttupleargs

```
const Arrays = type({
 key: "string[]"
})
```

### [lengths](https://arktype.io/docs/objects#arrays-lengths)

Constrain an array with an inclusive or exclusive min or max length.

stringfluent

```
const Bounded = type({
 nonEmptyStringArray: "string[] > 0",
 atLeast3Integers: "number.integer[] >= 3",
 lessThan10Emails: "string.email[] < 10",
 atMost5Booleans: "boolean[] <= 5"
})
```

Range expressions allow you to specify both a min and max length and use the same syntax for exclusivity.

stringfluent

```
const Range = type({
 nonEmptyStringArrayAtMostLength10: "0 < string[] <= 10",
 twoToFiveIntegers: "2 <= number.integer[] < 6"
})
```

## [tuples](https://arktype.io/docs/objects#tuples)

Like objects, tuples are structures whose values are nested definitions. Like TypeScript, ArkType supports prefix,
optional, variadic, and postfix elements, with the same restrictions about combining them.

### [prefix](https://arktype.io/docs/objects#tuples-prefix)

stringfluent

```
const MyTuple = type([\
 "string",\
 // Object definitions can be nested in tuples- and vice versa!\
 {\
  coordinates: ["number", "number"]\
 }\
])
```

### [defaultable](https://arktype.io/docs/objects#tuples-defaultable)

Defaultable elements are optional elements that will be assigned their specified default if not present in the tuple's
input.

A tuple may include zero or more defaultable elements following its prefix elements and preceding its non-defaultable
optional elements.

Like optional elements, defaultable elements are mutually exclusive with postfix elements.

stringfluenttuple

```
const MyTuple = type(["string", "boolean = false", "number = 0"])
```

### [optional](https://arktype.io/docs/objects#tuples-optional)

Optional elements are tuple elements that may or may not be present in the input that do not have a default value.

A tuple may include zero or more optional elements following its prefix and defaultable elements and preceding either a
variadic element or the end of the tuple.

Like in TypeScript, optional elements are mutually exclusive with postfix elements.

stringfluenttuple

```
const MyTuple = type(["string", "bigint = 999n", "boolean?", "number?"])
```

### [variadic](https://arktype.io/docs/objects#tuples-variadic)

Like in TypeScript, variadic elements allow zero or more consecutive values of a given type and may occur at most once
in a tuple.

They are specified with a `"..."` operator preceding an array element.

stringfluent

```
// allows a string followed by zero or more numbers
const MyTuple = type(["string", "...", "number[]"])
```

### [postfix](https://arktype.io/docs/objects#tuples-postfix)

Postfix elements are required elements following a variadic element.

They are mutually exclusive with optional elements.

stringfluent

```
// allows zero or more numbers followed by a boolean, then a string
const MyTuple = type(["...", "number[]", "boolean", "string"])
```

## [dates](https://arktype.io/docs/objects#dates)

### [literals](https://arktype.io/docs/objects#dates-literals)

Date literals represent a Date instance with an exact value.

They're primarily useful in ranges.

```
const Literals = type({
 singleQuoted: "d'01-01-1970'",
 doubleQuoted: 'd"01-01-1970"'
})
```

### [ranges](https://arktype.io/docs/objects#dates-ranges)

Constrain a Date with an inclusive or exclusive min or max.

Bounds can be expressed as either a [number](https://arktype.io/docs/primitives#number-literals) representing its
corresponding Unix epoch value or a [Date literal](https://arktype.io/docs/objects#dates-literals).

stringfluent

```
const Bounded = type({
 dateInThePast: `Date < ${Date.now()}`,
 dateAfter2000: "Date > d'2000-01-01'",
 dateAtOrAfter1970: "Date >= 0"
})
```

Range expressions allow you to specify both a min and max and use the same syntax for exclusivity.

stringfluent

```
const tenYearsAgo = new Date()
 .setFullYear(new Date().getFullYear() - 10)
 .valueOf()

const Bounded = type({
 dateInTheLast10Years: `${tenYearsAgo} <= Date < ${Date.now()}`
})
```

## [instanceof](https://arktype.io/docs/objects#instanceof)

Most built-in instance types like `Array` and `Date` are available directly as keywords, but `instanceof` can be useful
for constraining a type to one of your own classes.

fluenttupleargs

```
class MyClass {}

const instances = type.instanceOf(MyClass)
```

### [keywords](https://arktype.io/docs/objects#instanceof-keywords)

A list of instanceof keywords can be found [here](https://arktype.io/docs/keywords#instanceof) alongside the base and
subtype keywords for [Array](https://arktype.io/docs/keywords#array) and
[FormData](https://arktype.io/docs/keywords#formdata).

[undefined\\ \\ Previous Page](https://arktype.io/docs/primitives#undefined)
[required\\ \\ Next Page](https://arktype.io/docs/objects#properties-required)

### On this page

[properties](https://arktype.io/docs/objects#properties) [required](https://arktype.io/docs/objects#properties-required)
[optional](https://arktype.io/docs/objects#properties-optional)
[defaultable](https://arktype.io/docs/objects#properties-defaultable)
[index](https://arktype.io/docs/objects#properties-index)
[undeclared](https://arktype.io/docs/objects#properties-undeclared)
[spread](https://arktype.io/docs/objects#properties-spread) [keyof](https://arktype.io/docs/objects#properties-keyof)
[get](https://arktype.io/docs/objects#properties-get) [arrays](https://arktype.io/docs/objects#arrays)
[lengths](https://arktype.io/docs/objects#arrays-lengths) [tuples](https://arktype.io/docs/objects#tuples)
[prefix](https://arktype.io/docs/objects#tuples-prefix)
[defaultable](https://arktype.io/docs/objects#tuples-defaultable)
[optional](https://arktype.io/docs/objects#tuples-optional) [variadic](https://arktype.io/docs/objects#tuples-variadic)
[postfix](https://arktype.io/docs/objects#tuples-postfix) [dates](https://arktype.io/docs/objects#dates)
[literals](https://arktype.io/docs/objects#dates-literals) [ranges](https://arktype.io/docs/objects#dates-ranges)
[instanceof](https://arktype.io/docs/objects#instanceof) [keywords](https://arktype.io/docs/objects#instanceof-keywords)
