---
title: 'Traversal API'
source: https://arktype.io/docs/traversal-api
url: https://arktype.io/docs/traversal-api
---

[📈 Announcing ArkType 2.1 📈](https://arktype.io/docs/blog/2.1)

# Traversal API

| Name     | Summary                                                                                                                                            | Notes & Examples                                                                                                                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| path     | the path being validated or morphed                                                                                                                | ✅ array indices represented as numbers<br>⚠️ mutated during traversal - use `path.slice(0)` to snapshot<br>🔗 use<br>[propString](https://arktype.io/docs/traversal-api#propString)<br>for a stringified version |
| errors   | [ArkErrors](https://arktype.io/docs/traversal-api#ArkErrors)<br>that will be part of this traversal's finalized result                             | ✅ will always be an empty array for a valid traversal                                                                                                                                                            |
| root     | the original value being traversed                                                                                                                 |                                                                                                                                                                                                                   |
| config   | configuration for this traversal                                                                                                                   | ✅ options can affect traversal results and error messages<br>✅ defaults < global config < scope config<br>✅ does not include options configured on individual types                                            |
| reject   | add an<br>[ArkError](https://arktype.io/docs/traversal-api#ArkError)<br>and return `false`                                                         | ✅ useful for predicates like `.narrow`                                                                                                                                                                           |
| mustBe   | add an<br>[ArkError](https://arktype.io/docs/traversal-api#ArkError)<br>from a description and return `false`                                      | ✅ useful for predicates like `.narrow`<br>🔗 equivalent to<br>[reject](https://arktype.io/docs/traversal-api#reject)<br>({ expected })                                                                           |
| error    | add and return an<br>[ArkError](https://arktype.io/docs/traversal-api#ArkError)                                                                    | ✅ useful for morphs like `.pipe`                                                                                                                                                                                 |
| hasError | whether<br>[currentBranch](https://arktype.io/docs/traversal-api#currentBranch)<br>(or the traversal root, outside a union) has one or more errors |                                                                                                                                                                                                                   |

[toJsonSchema\\ \\ Previous Page](https://arktype.io/docs/type-api#tojsonschema)
[Integrations\\ \\ Next Page](https://arktype.io/docs/integrations)
