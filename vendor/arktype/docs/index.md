---
title: "ArkType: TypeScript's 1:1 validator, optimized from editor to runtime"
source: http://arktype.io/
url: https://arktype.io/
---

[📈 Announcing ArkType 2.1 📈](https://arktype.io/docs/blog/2.1)

neovim-mark@2x

Bun Logo

# ArkType

TypeScript's 1:1 validator, optimized from editor to runtime

[6.5k](https://github.com/arktypeio/arktype) [Playground](https://arktype.io/playground)
[Intro](https://arktype.io/docs/intro/setup)

1

import{ type }from"arktype"

Playground Mode

Type-level feedback with each keystroke- **no plugins or build steps required**.

### Unparalleled DX

Type syntax you already know with safety and completions unlike anything you've ever seen

```
const User = type({
 name: "string",
 platform: "'android' | 'ios'",
 "version?": "number | snumber | stringnumber | symbol"
})
```

### Better Errors

Deeply customizable messages with great defaults

```
const out = User({
 name: "Alan Turing",
 platform: "enigma",
 versions: [0, "1", 0n]
})

if (out instanceof type.errors) {
 // hover summary to see validation errors
 console.error(out.summary)
}
```

### Clarity and Concision

Definitions are half as long, type errors are twice as readable, and hovers tell you just what really matters

```
// hover me
const User = type({
 name: "string",
 platform: "'android' | 'ios'",
 "versions?": "number | string)[]"
TypeScript: Unmatched ) before [] })
```

### Faster... everything

20x faster than Zod4 and 2,000x faster than Yup at runtime, with editor performance that will remind you how
autocomplete is supposed to feel

###### Object Validation, Node v23.6.1

[(source)](https://moltar.github.io/typescript-runtime-type-benchmarks/)

ArkType ⚡ 14 nanoseconds

Zod 👍 281 nanoseconds

Yup 🐌 40755 nanoseconds\*

\*scaling generously logarithmized

### Deep Introspectability

ArkType uses set theory to understand and expose the relationships between your types at runtime the way TypeScript does
at compile time

```
User.extends("object") // true
User.extends("string") // false
// true (string is narrower than unknown)
User.extends({
 name: "unknown"
})
// false (string is wider than "Alan")
User.extends({
 name: "'Alan'"
})
```

### Intrinsic Optimization

Every schema is internally normalized and reduced to its purest and fastest representation

```
// all unions are optimally discriminated
// even if multiple/nested paths are needed
const Account = type({
 kind: "'admin'",
 "powers?": "string[]"
}).or({
 kind: "'superadmin'",
 "superpowers?": "string[]"
}).or({
 kind: "'pleb'"
})
```

[**Doc up** \\ \\ Everything you need to know from installation to integration](https://arktype.io/docs/intro/setup)
