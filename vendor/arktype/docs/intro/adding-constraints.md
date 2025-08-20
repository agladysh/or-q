---
title: 'Adding Constraints'
source: https://arktype.io/docs/intro/adding-constraints
url: https://arktype.io/docs/intro/adding-constraints
---

[📈 Announcing ArkType 2.1 📈](https://arktype.io/docs/blog/2.1)

Intro

# Adding Constraints

TypeScript is extremely versatile for representing types like `string` or `number`, but what about `email` or
`integer less than 100`?

In ArkType, conditions that narrow a type beyond its **basis** are called **constraints**.

Constraints are a first-class citizen of ArkType. They are fully composable with TypeScript's built-in operators and
governed by the same underlying principles of set-theory.

## [Define](https://arktype.io/docs/intro/adding-constraints#define)

Let's create a new `contact` Type that enforces our example constraints.

```
const Contact = type({
 // many common constraints are available as built-in keywords
 email: "string.email",
 // others can be written as type-safe expressions
 score: "number.integer < 100"
})

// if you need the TS type, just infer it out as normal
type Contact = typeof Contact.infer
```

## [Compose](https://arktype.io/docs/intro/adding-constraints#compose)

Imagine we want to define a new Type representing a non-empty list of `Contact`.

While the expression syntax we've been using is ideal for creating new types, chaining is a great way to refine or
transform existing ones.

```
const _Contact = type({
 email: "string.email",
 score: "number.integer < 100"
})

type _Contact = typeof _Contact.t

interface Contact extends _Contact {}

export const Contact: type<Contact> = _Contact
const Contacts = Contact.array().atLeastLength(1)
```

## [Narrow](https://arktype.io/docs/intro/adding-constraints#narrow)

Structured constraints like divisors and ranges will only take us so far. Luckily, they integrate seamlessly with
whatever custom validation logic you need.

```

// there's no "not divisible" expression - need to narrow
const Odd = type("number").narrow((n, ctx) =>
 // if even, add a customizable error and return false
 n % 2 === 0 ? ctx.mustBe("odd") : true
)

const FavoriteNumbers = type({
 even: "number % 2",
 odd: Odd
})

const out = FavoriteNumbers({
 even: 7,
 odd: 8
})

if (out instanceof type.errors) {
 // hover summary to see validation errors
 console.error(out.summary)
} else {
 console.log(out.odd)
}
```

You now know how to refine your types to enforce additional constraints at runtime.

But what if once your input is fully validated, you still need to make some adjustments before it's ready to use?

The final section of intro will cover **morphs**, an extremely powerful tool for composing and transforming Types.

[Your First Type\\ \\ Previous Page](https://arktype.io/docs/intro/your-first-type)
[Morphs & More\\ \\ Next Page](https://arktype.io/docs/intro/morphs-and-more)

### On this page

[Define](https://arktype.io/docs/intro/adding-constraints#define)
[Compose](https://arktype.io/docs/intro/adding-constraints#compose)
[Narrow](https://arktype.io/docs/intro/adding-constraints#narrow)
