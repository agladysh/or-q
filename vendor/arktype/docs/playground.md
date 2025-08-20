---
title: "ArkType Playground: TypeScript's 1:1 validator, optimized from editor to runtime"
source: https://arktype.io/playground
url: https://arktype.io/playground
---

[📈 Announcing ArkType 2.1 📈](https://arktype.io/docs/blog/2.1)

1

2

3

4

5

6

7

8

9

10

11

12

import{ type }from"arktype"

const Thing =type({

    name: "string",

"versions?": "(number\|string)\[\]"

})

constout=Thing({

    name:"TypeScript",

    versions:\["5.8.2",6, 7n\]

})

### Type

.expression.description.toJsonSchema().json.precompilation

Syntactic string similar to native TypeScript

```
{ name: string, versions?: (number | string)[] }
```

### ArkErrors

```
versions[2] must be a number or a string (was a bigint)
```
