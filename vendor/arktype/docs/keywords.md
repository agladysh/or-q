---
title: 'Keywords'
source: https://arktype.io/docs/keywords
url: https://arktype.io/docs/keywords
---

[📈 Announcing ArkType 2.1 📈](https://arktype.io/docs/blog/2.1)

# Keywords

### [TypeScript](https://arktype.io/docs/keywords#typescript)

All\* built-in TypeScript keywords are directly available.

stringfluent

```
const Keywords = type({
 string: "string",
 date: "Date"
})
```

\\\* `any` and `void` are misleading and unnecessary for runtime validation and so are not included as keywords by
default.

### [Subtype](https://arktype.io/docs/keywords#subtype)

Subtype keywords refine or transform their root type.

stringfluent

```
const Keywords = type({
 dateFormattedString: "string.date",
 transformStringToDate: "string.date.parse",
 isoFormattedString: "string.date.iso",
 transformIsoFormattedStringToDate: "string.date.iso.parse"
})
```

You can easily explore available subtypes via autocomplete by with a partial definition like `"string."`.

### [All Keywords](https://arktype.io/docs/keywords#all-keywords)

This table includes all keywords available in default `type` API. To define your own string-embeddable keywords, see
[scopes](https://arktype.io/docs/scopes).

## string

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

## number

| Alias                   | Description                                             |
| ----------------------- | ------------------------------------------------------- |
| number                  | a number                                                |
| number.Infinity         | Infinity                                                |
| number.NaN              | NaN                                                     |
| number.NegativeInfinity | -Infinity                                               |
| number.epoch            | an integer representing a safe Unix timestamp           |
| number.integer          | an integer                                              |
| number.safe             | at least -9007199254740991 and at most 9007199254740991 |

## other

| Alias       | Description          |
| ----------- | -------------------- |
| Key         | a string or a symbol |
| bigint      | a bigint             |
| boolean     | boolean              |
| false       | false                |
| never       | never                |
| null        | null                 |
| symbol      | a symbol             |
| true        | true                 |
| undefined   | undefined            |
| unknown     | unknown              |
| unknown.any | unknown              |

## object

| Alias                 | Description                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------- |
| object                | an object                                                                                     |
| object.json           | { \[string\]: $jsonObject, a number, a string, false, null or true }                          |
| object.json.stringify | a morph from { \[string\]: $jsonObject, a number, a string, false, null or true } to a string |

## array

| Alias          | Description                      |
| -------------- | -------------------------------- |
| Array          | an array                         |
| Array.index    | matched by ^(?:0\|\[1-9\]\\d\*)$ |
| Array.liftFrom | a generic type for Function      |
| Array.readonly | an array                         |
| ArrayBuffer    | an ArrayBuffer instance          |

## FormData

| Alias           | Description                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| FormData        | a FormData instance                                                         |
| FormData.parse  | a morph from a FormData instance to an object representing parsed form data |
| FormData.parsed | an object representing parsed form data                                     |
| FormData.value  | a string or a File instance                                                 |

## TypedArray

| Alias                   | Description         |
| ----------------------- | ------------------- |
| TypedArray.BigInt64     | a BigInt64Array     |
| TypedArray.BigUint64    | a BigUint64Array    |
| TypedArray.Float32      | a Float32Array      |
| TypedArray.Float64      | a Float64Array      |
| TypedArray.Int16        | an Int16Array       |
| TypedArray.Int32        | an Int32Array       |
| TypedArray.Int8         | an Int8Array        |
| TypedArray.Uint16       | a Uint16Array       |
| TypedArray.Uint32       | a Uint32Array       |
| TypedArray.Uint8        | a Uint8Array        |
| TypedArray.Uint8Clamped | a Uint8ClampedArray |

## instanceof

| Alias    | Description         |
| -------- | ------------------- |
| Blob     | a Blob instance     |
| Date     | a Date              |
| Error    | an Error            |
| File     | a File instance     |
| Function | a function          |
| Headers  | a Headers instance  |
| Map      | a Map               |
| Promise  | a Promise           |
| RegExp   | a RegExp            |
| Request  | a Request instance  |
| Response | a Response instance |
| Set      | a Set               |
| URL      | a URL instance      |
| WeakMap  | a WeakMap           |
| WeakSet  | a WeakSet           |

## generic

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

[instanceof\\ \\ Previous Page](https://arktype.io/docs/objects#instanceof)
[Expressions\\ \\ Next Page](https://arktype.io/docs/expressions)

### On this page

[TypeScript](https://arktype.io/docs/keywords#typescript) [Subtype](https://arktype.io/docs/keywords#subtype)
[All Keywords](https://arktype.io/docs/keywords#all-keywords)
