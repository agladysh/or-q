---
title: 'Expressions'
source: https://arktype.io/docs/expressions
url: https://arktype.io/docs/expressions
---

[📈 Announcing ArkType 2.1 📈](https://arktype.io/docs/blog/2.1)

# Expressions

### [Intersection](https://arktype.io/docs/expressions#intersection)

Like its TypeScript counterpart, an intersection combines two existing `Type` s to create a new `Type` that enforces the
constraints of both.

stringfluentfunctiontupleargs

```
const MyObj = type({
 // an email address with the domain arktype.io
 intersected: "string.email & /@arktype\\.io$/"
})
```

### [Union](https://arktype.io/docs/expressions#union)

All unions are automatically discriminated to optimize check time and error message clarity.

stringfluentfunctiontupleargs

```
const Unions = type({
 key: "string | number"
})
```

A union that could apply different morphs to the same data throws a ParseError!

```
// operands overlap, but neither transforms data
const Okay = type("number > 0").or("number < 10")
// operand transforms data, but there's no overlap between the inputs
const AlsoOkay = type("string.numeric.parse").or({ box: "string" })
// operands overlap and transform data, but in the same way
const StillOkay = type("string > 5", "=>", Number.parseFloat).or([\
 "0 < string < 10",\
 "=>",\
 Number.parseFloat\
])
// ParseError: An unordered union of a type including a morph and a type with overlapping input is indeterminate
const Bad = type({ box: "string.numeric.parse" }).or({ box: "string" })
const SameError = type({ a: "string.numeric.parse" }).or({ b: "string.numeric.parse" })
```

Learn the set theory behind this restriction

If you're relatively new to set-based types, that error might be daunting, but if you take a second to think through the
example, it becomes clear why this isn't allowed. The logic of `bad` is essentially:

- If the input is an object where `box` is a `string`, parse and return it as a number
- If the input is an object where `box` is a `string`, return it as a string

There is no way to deterministically return an output for this type without sacrificing the
[commutativity](https://en.wikipedia.org/wiki/Commutative_property) of the union operator.

`sameError` may look more innocuous, but has the same problem for an input like `{ a: "1", b: "2" }`.

- Left branch would only parse `a`, resulting in `{ a: 1, b: "2" }`
- Right branch would only parse `b`, resulting in `{ a: "1", b: 2 }`

### [Brand](https://arktype.io/docs/expressions#brand)

Add a type-only symbol to an existing type so that the only values that satisfy it are those that have been directly
validated.

stringfluent

```
const Even = type("(number % 2)#even")
type Even = typeof even.infer

const good: Even = even.assert(2)
// TypeScript: Type 'number' is not assignable to type 'Brand<number, "even">'
const bad: Even = 5
```

Brands can be a great way to represent constraints that fall outside the scope TypeScript, but remember they don't
change anything about what is enforced at runtime!

For more information on branding in general, check out
[this excellent article](https://www.learningtypescript.com/articles/branded-types) from
[Josh Goldberg](https://github.com/joshuakgoldberg).

### [Narrow](https://arktype.io/docs/expressions#narrow)

Narrow expressions allow you to add custom validation logic and error messages. You can read more about them in
[their intro section](https://arktype.io/docs/intro/adding-constraints#narrow).

fluenttupleargs

```
const Form = type({
 password: "string",
 confirmPassword: "string"
}).narrow((data, ctx) => {
 if (data.password === data.confirmPassword) {
  return true
 }
 return ctx.reject({
  expected: "identical to password",
  // don't display the password in the error message!
  actual: "",
  path: ["confirmPassword"]
 })
})

// ArkErrors: confirmPassword must be identical to password
const out = Form({
 password: "arktype",
 confirmPassword: "artkype"
})
```

If the return type of a narrow is a type predicate, that will be reflected in the inferred `Type`.

fluenttupleargs

```
// hover to see how the predicate is propagated to the outer `Type`
const ArkString = type("string").narrow(
 (data, ctx): data is `ark${string}` =>
  data.startsWith("ark") ?? ctx.reject("a string starting with 'ark'")
)
```

### [Morph](https://arktype.io/docs/expressions#morph)

Morphs allow you to transform your data after it is validated. You can read more about them in
[their intro section](https://arktype.io/docs/intro/morphs-and-more).

fluentfunctiontupleargs

```
// hover to see how morphs are represented at a type-level
const trimStringStart = type("string").pipe(str => str.trimStart())
```

#### [To](https://arktype.io/docs/expressions#to)

If a morph returns an `ArkErrors` instance, validation will fail with that result instead of it being treated as a
value. This is especially useful for using other Types as morphs to validate output or chain transformations.

To make this easier, there's a special `to` operator that can pipe to a parsed definition without having to wrap it in
`type` to make it a function:

stringfluenttupleargs

```
const parseEvenTo = type("string.numeric.parse |> number % 2")

const Even = type("number % 2")
// equivalent to parseEvenTo
const parseEvenPipe = type("string.numeric.parse").pipe(Even)
```

### [Unit](https://arktype.io/docs/expressions#unit)

While embedded [literal syntax](https://arktype.io/docs/primitives#number-literals) is usually ideal for defining exact
primitive values, `===` and `type.unit` can be helpful for referencing a non-serialiazable value like a `symbol` from
your type.

fluenttupleargs

```
const mySymbol = Symbol()

const ExactValue = type.unit(mySymbol)
```

### [Enumerated](https://arktype.io/docs/expressions#enumerated)

`type.enumerated` defines a Type based on a list of allowed values. It is semantically equivalent to `type.unit` if
provided a single value.

fluenttupleargs

```
const mySymbol = Symbol()

const ExactValueFromSet = type.enumerated(1337, true, mySymbol)
```

### [valueOf](https://arktype.io/docs/expressions#valueof)

`type.valueOf` defines a Type from a TypeScript `enum` or enum-like object.

\`enum\` should be avoided in modern TypeScript

Over time, TS has shifted away from features that affect the `.js` it ultimately outputs, including `enum`.

With the introduction of the
[`--erasableSyntaxOnly` option](https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly) to facilitate
type-stripping, `enum` is no longer considered a best practice.

`type.valueOf` exists primarily to facilitate integration with legacy code that relies on `enum`, but if you have the
option, prefer transparently defining value sets via `["tupleLiterals"] as const`, `{ objectLiterals: true } as const`,
or directly via [`type.enumerated`](https://arktype.io/docs/expressions#enumerated).

```
enum TsEnum {
 numeric = 1
}

const EnumType = type.valueOf(TsEnum) // Type<1>
```

It is _almost_ semantically identical to `type.enumerated(...Object.values(o))`. The only exception occurs when an
object has an entry with a numeric value and entry with that value as a key mapping back to the original:

```
// this is the structure TsEnum compiles to in JS
const equivalentObject = {
 numeric: 1,
 "1": "numeric"
} as const

// only allows the number 1 even though it is inferred
// to also allow the string "numeric"
const EquivalentObject = type.valueOf(equivalentObject)
```

Notice `EquivalentObject` doesn't include `"numeric"` because it inverts a numeric value entry.

We recommend `type.enumerated` as the more transparent option for converting value references to a Type. However, if the
described inverted entry pairs can't exist on your object, you can safely use `type.valueOf`.

### [Meta](https://arktype.io/docs/expressions#meta)

Metadata allows you to associate arbitrary metadata with your types.

Some metadata is consumed directly by ArkType, for example `description` is referenced by default when building an error
message.

Other properties are introspectable, but aren't used by default internally.

fluenttupleargs

```
// this validator's error message will now start with "must be a special string"
const SpecialString = type("string").configure({
 description: "a special string"
})

// sugar for adding description metadata
const SpecialNumber = type("number").describe("a special number")
```

### [Cast](https://arktype.io/docs/expressions#cast)

Sometimes, you may want to directly specify how a `Type` should be inferred without affecting the runtime behavior. In
these cases, you can use a cast expression.

stringfluent

```
// allow any string, but suggest "foo" and "bar"
type AutocompletedString = "foo" | "bar" | (string & {})

const MyObj = type({
 autocompletedString: "string" as type.cast<AutocompletedString>
})
```

### [Parenthetical](https://arktype.io/docs/expressions#parenthetical)

By default, ArkType's operators follow the same precedence as TypeScript's. Also like in TypeScript, this can be
overridden by wrapping an expression in parentheses.

```
// hover to see the distinction!
const Groups = type({
 stringOrArrayOfNumbers: "string | number[]",
 arrayOfStringsOrNumbers: "(string | number)[]"
})
```

### [this](https://arktype.io/docs/expressions#this)

`this` is a special keyword that can be used to create a recursive type referencing the root of the current definition.

```
const DisappointingGift = type({
 label: "string",
 "box?": "this"
})

const out = DisappointingGift({
 label: "foo",
 box: { label: "bar", box: {} }
})

if (out instanceof type.errors) {
 // ArkErrors: box.box.label must be a string (was missing)
 console.error(out.summary)
} else {
 // narrowed inference to arbitrary depth
 console.log(out.box?.box?.

label: string | undefinedlabel)
}
```

Referencing `this` from within a scope will result in a ParseError. For similar behavior within a scoped definition,
just reference the alias by name:

```
const types = scope({
 DisappointingGift: {
  label: "string",
  // Resolves correctly to the root of the current type
  "box?": "DisappointingGift"
 }
}).export()
```

[Keywords\\ \\ Previous Page](https://arktype.io/docs/keywords)
[intersection\\ \\ Next Page](https://arktype.io/docs/expressions#intersection)

### On this page

[Intersection](https://arktype.io/docs/expressions#intersection) [Union](https://arktype.io/docs/expressions#union)
[Brand](https://arktype.io/docs/expressions#brand) [Narrow](https://arktype.io/docs/expressions#narrow)
[Morph](https://arktype.io/docs/expressions#morph) [To](https://arktype.io/docs/expressions#to)
[Unit](https://arktype.io/docs/expressions#unit) [Enumerated](https://arktype.io/docs/expressions#enumerated)
[valueOf](https://arktype.io/docs/expressions#valueof) [Meta](https://arktype.io/docs/expressions#meta)
[Cast](https://arktype.io/docs/expressions#cast) [Parenthetical](https://arktype.io/docs/expressions#parenthetical)
[this](https://arktype.io/docs/expressions#this)
