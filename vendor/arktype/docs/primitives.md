---
title: 'Primitives'
source: https://arktype.io/docs/primitives
url: https://arktype.io/docs/primitives
---

[📈 Announcing ArkType 2.1 📈](https://arktype.io/docs/blog/2.1)

# Primitives

## [string](https://arktype.io/docs/primitives#string)

### [keywords](https://arktype.io/docs/primitives#keywords)

The following keywords can be referenced in any definition, e.g.:

```
const Email = type("string.email")

const User = type({
 data: "string.json.parse",
 ids: "string.uuid.v4[]"
})
```

| Alias                              | Description                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------- |
| string                             | a string                                                                    |
| string.alpha                       | only letters                                                                |
| string.alphanumeric                | only letters and digits 0-9                                                 |
| string.base64                      | base64-encoded                                                              |
| string.base64.url                  | base64url-encoded                                                           |
| string.capitalize                  | a morph from a string to capitalized                                        |
| string.capitalize.preformatted     | capitalized                                                                 |
| string.creditCard                  | a credit card number and a credit card number                               |
| string.date                        | a string and a parsable date                                                |
| string.date.epoch                  | an integer string representing a safe Unix timestamp                        |
| string.date.epoch.parse            | a morph from an integer string representing a safe Unix timestamp to a Date |
| string.date.iso                    | an ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ) date                                 |
| string.date.iso.parse              | a morph from an ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ) date to a Date          |
| string.date.parse                  | a morph from a string and a parsable date to a Date                         |
| string.digits                      | only digits 0-9                                                             |
| string.email                       | an email address                                                            |
| string.hex                         | hex characters only                                                         |
| string.integer                     | a well-formed integer string                                                |
| string.integer.parse               | a morph from a well-formed integer string to an integer                     |
| string.ip                          | an IP address                                                               |
| string.ip.v4                       | an IPv4 address                                                             |
| string.ip.v6                       | an IPv6 address                                                             |
| string.json                        | a JSON string                                                               |
| string.json.parse                  | safe JSON string parser                                                     |
| string.lower                       | a morph from a string to only lowercase letters                             |
| string.lower.preformatted          | only lowercase letters                                                      |
| string.normalize                   | a morph from a string to NFC-normalized unicode                             |
| string.normalize.NFC               | a morph from a string to NFC-normalized unicode                             |
| string.normalize.NFC.preformatted  | NFC-normalized unicode                                                      |
| string.normalize.NFD               | a morph from a string to NFD-normalized unicode                             |
| string.normalize.NFD.preformatted  | NFD-normalized unicode                                                      |
| string.normalize.NFKC              | a morph from a string to NFKC-normalized unicode                            |
| string.normalize.NFKC.preformatted | NFKC-normalized unicode                                                     |
| string.normalize.NFKD              | a morph from a string to NFKD-normalized unicode                            |
| string.normalize.NFKD.preformatted | NFKD-normalized unicode                                                     |
| string.numeric                     | a well-formed numeric string                                                |
| string.numeric.parse               | a morph from a well-formed numeric string to a number                       |
| string.regex                       | a string and a regex pattern                                                |
| string.semver                      | a semantic version (see <https://semver.org/>)                              |
| string.trim                        | a morph from a string to trimmed                                            |
| string.trim.preformatted           | trimmed                                                                     |
| string.upper                       | a morph from a string to only uppercase letters                             |
| string.upper.preformatted          | only uppercase letters                                                      |
| string.url                         | a string and a URL string                                                   |
| string.url.parse                   | a morph from a string and a URL string to a URL instance                    |
| string.uuid                        | a UUID                                                                      |
| string.uuid.v1                     | a UUIDv1                                                                    |
| string.uuid.v2                     | a UUIDv2                                                                    |
| string.uuid.v3                     | a UUIDv3                                                                    |
| string.uuid.v4                     | a UUIDv4                                                                    |
| string.uuid.v5                     | a UUIDv5                                                                    |
| string.uuid.v6                     | a UUIDv6                                                                    |
| string.uuid.v7                     | a UUIDv7                                                                    |
| string.uuid.v8                     | a UUIDv8                                                                    |

### [literals](https://arktype.io/docs/primitives#string-literals)

```
const Literals = type({
 singleQuoted: "'typescript'",
 doubleQuoted: '"arktype"'
})
```

### [patterns](https://arktype.io/docs/primitives#string-patterns)

Regex literals specify an unanchored regular expression that an input string must match.

They can either be string-embedded or refer directly to a `RegExp` instance.

```
const Literals = type({
 stringEmbedded: "/^a.*z$/",
 regexLiteral: /^a.*z$/
})
```

### [lengths](https://arktype.io/docs/primitives#string-lengths)

Constrain a string with an inclusive or exclusive min or max length.

stringfluent

```
const Bounded = type({
 nonEmpty: "string > 0",
 atLeastLength3: "string.alphanumeric >= 3",
 lessThanLength10: "string < 10",
 atMostLength5: "string <= 5"
})
```

Range expressions allow you to specify both a min and max length and use the same syntax for exclusivity.

stringfluent

```
const Range = type({
 nonEmptyAtMostLength10: "0 < string <= 10",
 integerStringWith2To5Digits: "2 <= string.integer < 6"
})
```

## [number](https://arktype.io/docs/primitives#number)

### [keywords](https://arktype.io/docs/primitives#number-keywords)

The following keywords can be referenced in any definition, e.g.:

```
const User = type({
 createdAt: "number.epoch",
 age: "number.integer >= 0"
})
```

| Alias                   | Description                                             |
| ----------------------- | ------------------------------------------------------- |
| number                  | a number                                                |
| number.Infinity         | Infinity                                                |
| number.NaN              | NaN                                                     |
| number.NegativeInfinity | -Infinity                                               |
| number.epoch            | an integer representing a safe Unix timestamp           |
| number.integer          | an integer                                              |
| number.safe             | at least -9007199254740991 and at most 9007199254740991 |

### [literals](https://arktype.io/docs/primitives#number-literals)

```
const Literals = type({
 number: "1337"
})
```

### [ranges](https://arktype.io/docs/primitives#number-ranges)

Constrain a number with an inclusive or exclusive min or max.

stringfluent

```
const Bounded = type({
 positive: "number > 0",
 atLeast3: "number.integer >= 3",
 lessThanPi: "number < 3.14159",
 atMost5: "number <= 5"
})
```

Range expressions allow you to specify both a min and max and use the same syntax for exclusivity.

stringfluent

```
const Range = type({
 positiveAtMostE: "0 < number <= 2.71828",
 evenNumberAbsoluteValueLessThan50: "-50 < (number % 2) < 50"
})
```

### [divisors](https://arktype.io/docs/primitives#number-divisors)

Constrain a `number` to a multiple of the specified integer.

stringfluent

```
const Evens = type({
 key: "number % 2"
})
```

## [bigint](https://arktype.io/docs/primitives#bigint)

To allow any `bigint` value, use the `"bigint"` keyword.

stringfluent

```
const Bigints = type({
 foo: "bigint"
})
```

### [literals](https://arktype.io/docs/primitives#bigint-literals)

To require an exact `bigint` value in your type, you can use add the suffix `n` to a string-embedded
[number literal](https://arktype.io/docs/primitives#number-literals) to make it a `bigint`.

```
const Literals = type({
 bigint: "1337n"
})
```

You may also use a [unit expression](https://arktype.io/docs/expressions#unit) to define `bigint` literals.

## [symbol](https://arktype.io/docs/primitives#symbol)

To allow any `symbol` value, use the `"symbol"` keyword.

stringfluent

```
const Symbols = type({
 key: "symbol"
})
```

To reference a specific symbol in your definition, use a [unit expression](https://arktype.io/docs/expressions#unit).

No special syntax is required to define symbolic properties like `{ [mySymbol]: "string" }`. For more information and
examples of how to combine symbolic keys with other syntax like optionality, see
[properties](https://arktype.io/docs/objects#properties).

## [boolean](https://arktype.io/docs/primitives#boolean)

To allow `true` or `false`, use the `"boolean"` keyword.

stringfluent

```
const Booleans = type({
 key: "boolean"
})
```

### [literals](https://arktype.io/docs/primitives#boolean-literals)

To require a specific boolean value, use the corresponding literal.

stringfluent

```
const Booleans = type({
 a: "true",
 b: "false",
 // equivalent to the "boolean" keyword
 c: "true | false"
})
```

## [null](https://arktype.io/docs/primitives#null)

The `"null"` keyword can be used to allow the exact value `null`, generally as part of a
[union](https://arktype.io/docs/expressions#union).

stringfluent

```
const MyObj = type({
 foo: "number | null"
})
```

## [undefined](https://arktype.io/docs/primitives#undefined)

The `"undefined"` keyword can be used to allow the exact value `undefined`, generally as part of a
[union](https://arktype.io/docs/expressions#union).

stringfluent

```
const MyObj = type({
 requiredKey: "number | undefined",
 "optionalKey?": "number | undefined"
})
```

Allowing undefined as a value does not make the key optional!

In TypeScript, a required property that allows `undefined` must still be present for the type to be satisfied.

The same is true in ArkType.

See an example

```
const MyObj = type({
 key: "number | undefined"
})

// valid data
const validResult = MyObj({ key: undefined })

// Error: name must be a number or undefined (was missing)
const errorResult = MyObj({})
```

[Morphs & More\\ \\ Previous Page](https://arktype.io/docs/intro/morphs-and-more)
[keywords\\ \\ Next Page](https://arktype.io/docs/primitives#string-keywords)

### On this page

[string](https://arktype.io/docs/primitives#string) [keywords](https://arktype.io/docs/primitives#keywords)
[literals](https://arktype.io/docs/primitives#string-literals)
[patterns](https://arktype.io/docs/primitives#string-patterns)
[lengths](https://arktype.io/docs/primitives#string-lengths) [number](https://arktype.io/docs/primitives#number)
[keywords](https://arktype.io/docs/primitives#number-keywords)
[literals](https://arktype.io/docs/primitives#number-literals)
[ranges](https://arktype.io/docs/primitives#number-ranges)
[divisors](https://arktype.io/docs/primitives#number-divisors) [bigint](https://arktype.io/docs/primitives#bigint)
[literals](https://arktype.io/docs/primitives#bigint-literals) [symbol](https://arktype.io/docs/primitives#symbol)
[boolean](https://arktype.io/docs/primitives#boolean) [literals](https://arktype.io/docs/primitives#boolean-literals)
[null](https://arktype.io/docs/primitives#null) [undefined](https://arktype.io/docs/primitives#undefined)
