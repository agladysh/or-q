---
title: 'Morphs & More'
source: https://arktype.io/docs/intro/morphs-and-more
url: https://arktype.io/docs/intro/morphs-and-more
---

[📈 Announcing ArkType 2.1 📈](https://arktype.io/docs/blog/2.1)

Intro

# Morphs & More

Sometimes, data at the boundaries of your code requires more than validation before it's ready to use.

**Morphs** allow you to arbitrarily transform the shape and format of your data.

Morphs can be **piped** before, after or between validators and even chained to other morphs.

```
// Hover to see the type-level representation
const parseJson = type("string").pipe((s): object => JSON.parse(s))

// object: { ark: "type" }
const out = parseJson('{ "ark": "type" }')

// ArkErrors: must be a string (was object)
const badOut = parseJson(out)
```

This is a good start, but there are still a couple major issues with our morph.

What happens if we pass a string that isn't valid JSON?

```

// Uncaught SyntaxError: Expected property name ☠️
const badOut = parseJson('{ unquoted: "keys" }')
```

Despite what `JSON.parse` might have you believe, throwing exceptions and returning `any` are not very good ways to
parse a string. By default, ArkType assumes that if one of your morphs or narrows throws, you intend to crash.

If you do happen to find yourself at the mercy of an unsafe API, you might consider wrapping your function body in a
`try...catch`.

Luckily, there is a built-in API for wrapping `pipe` d functions you don't trust:

```
const parseJson = type("string").pipe.try((s): object => JSON.parse(s))

// Now returns an introspectable error instead of crashing 🎉
const badOut = parseJson('{ unquoted: "keys" }')

const out = parseJson('{ "ark": "type" }')

if (out instanceof type.errors) out.throw()
// Unfortunately, a validated `object` still isn't very useful...
else console.log(out)
```

The best part about `pipe` is that since any `Type` is root-invokable, `Type` s themselves _are_ already morphs! This
means validating out parsed output is as easy as adding another pipe:

```
const parseJson = type("string").pipe.try(
 (s): object => JSON.parse(s),
 type({
  name: "string",
  version: "string.semver"
 })
)

const out = parseJson('{ "name": "arktype", "version": "2.0.0" }')

if (!(out instanceof type.errors)) {
 // Logs "arktype:2.0.0"
 console.log(`${out.name}:${out.version}`)
}
```

At this point, our implementation is starting to look pretty clean, but in many cases like this one, we can skip
straight to the punch line with one of ArkType's many built-in aliases for validation and parsing, `string.json.parse`:

```
// .to is a sugared .pipe for a single parsed output validator
const parseJson = type("string.json.parse").to({
 name: "string",
 version: "string.semver"
})

const out = parseJson('{ "name": true, "version": "v2.0.0" }')

if (out instanceof type.errors) {
 // hover out.summary to see the default error message
 console.error(out.summary)
}
```

If you've made it this far, congratulations! You should have all the fundamental intuitions you need to bring your types
to runtime ⛵

Our remaining docs will help you understand the trade offs between ArkType's most important APIs so that no matter the
application, you can find a solution that feels great to write, great to read, and great to run.

[Adding Constraints\\ \\ Previous Page](https://arktype.io/docs/intro/adding-constraints)
[Primitives\\ \\ Next Page](https://arktype.io/docs/primitives)
