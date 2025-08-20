---
title: 'Your First Type'
source: https://arktype.io/docs/intro/your-first-type
url: https://arktype.io/docs/intro/your-first-type
---

[📈 Announcing ArkType 2.1 📈](https://arktype.io/docs/blog/2.1)

Intro

# Your First Type

If you already know TypeScript, congratulations- you just learned most of ArkType's syntax 🎉

## [Define](https://arktype.io/docs/intro/your-first-type#define)

```
import { type } from "arktype"

const User = type({
 name: "string",
 platform: "'android' | 'ios'",
 "versions?": "(number | string)[]"
})

// extract the type if needed
type User = typeof User.infer
```

If you make a mistake, don't worry- every definition gets the autocomplete and validation you're used to from your
editor, all within TypeScript's type system.

Will ArkType crash my TypeScript server?

Thousands of hours of optimization have gone into making validating native type syntax not just feasible, but often much
faster than alternatives ⚡

## [Compose](https://arktype.io/docs/intro/your-first-type#compose)

Suppose we want to move `platform` and `version` from our original type to a new `device` property.

```
const User = type({
 name: "string",
 // nested definitions don't need to be wrapped
 device: {
  platform: "'android' | 'ios'",
  "versions?": "(number | string)[]"
 }
})
```

To decouple `device` from `User`, just move it to its own type and reference it.

```
const Device = type({
 platform: "'android' | 'ios'",
 "versions?": "(number | string)[]"
})

const User = type({
 name: "string",
 device: Device
})
```

## [Validate](https://arktype.io/docs/intro/your-first-type#validate)

At runtime, we can pass `unknown` data to our type and get back either a validated `User` or an array of clear,
customizable errors with a root `summary`.

```
const out = User({
 name: "Alan Turing",
 device: {
  platform: "enigma",
  versions: [0, "1", 0n]
 }
})

if (out instanceof type.errors) {
 // hover out.summary to see validation errors
 console.error(out.summary)
} else {
 // hover out to see your validated data
 console.log(`Hello, ${out.name}`)
}
```

And that's it! You now know how to to define a `Type` use it to check your data at runtime.

Next, we'll take a look at how ArkType extends TypeScript's type system to handle runtime constraints like `maxLength`
and `pattern`.

[Setup\\ \\ Previous Page](https://arktype.io/docs/intro/setup)
[Adding Constraints\\ \\ Next Page](https://arktype.io/docs/intro/adding-constraints)

### On this page

[Define](https://arktype.io/docs/intro/your-first-type#define)
[Compose](https://arktype.io/docs/intro/your-first-type#compose)
[Validate](https://arktype.io/docs/intro/your-first-type#validate)
