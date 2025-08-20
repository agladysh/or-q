---
title: 'Scopes'
source: https://arktype.io/docs/scopes
url: https://arktype.io/docs/scopes
---

[📈 Announcing ArkType 2.1 📈](https://arktype.io/docs/blog/2.1)

# Scopes

Scopes are the foundation of ArkType, and one of the most powerful features for users wanting full control over
configuration and to make their own keywords available fluidly within string definition syntax.

A scope is just like a scope in code- a resolution space where you can define types, generics, or other scopes. The
`type` export is a actually just a method on our default `Scope`!

## [Defining a Scope](https://arktype.io/docs/scopes#defining-a-scope)

To define a scope, you may either `import { scope } from "arktype"` or use `type.scope` on the default `type` export.

A scope is specified as an object literal mapping names to definitions.

```
import { scope } from "arktype"

const coolScope = scope({
 // keywords are still available in your scope
 Id: "string",
 // but you can also reference your own aliases directly!
 User: { id: "Id", friends: "Id[]" },
 // your aliases will be autocompleted and validated alongside ArkType's keywords
 UsersById: {
  "[Id]": "User | undefined"
 }
})
```

`coolScope` is an object with reusable methods like `type` and `generic`. You can use it to create additional `Type` s
that can reference your **aliases**\- `id`, `user` and `usersById`.

Don't wrap your scoped definitions in type!

Even if you reference it as part of your scope definition, the global 'type' parser only knows about built-in keywords.

```
const badScope = scope({
 Id: "string",
 // ❌ wrapping this definition in `type` will fail
 BadEntity: type({
  id: "Id"
TypeScript: 'Id' is unresolvable  }),
 // ✅ reference scoped definitions directly instead of wrapping them
 GoodEntity: {
  id: "Id"
 }
})
```

If you need access to fluent syntax from within a Scope, see [thunks](https://arktype.io/docs/scopes#thunks).

```

const group = coolScope.type({
 name: "string",
 members: "User[]"
})

// chained definitions are parsed in the same scope as the original Type
const ownedGroup = group.and({
 ownerId: "Id"
})
```

To use the scoped types directly, you must `.export()` your `Scope` to a `Module`. A `Module` is just an object mapping
aliases to `Type` s. They can be used for validation or in any other context a `Type` can be used.

```

const coolModule = coolScope.export()

const out = coolModule.User({
 id: "99",
 friends: ["7", 8, "9"]
})

if (out instanceof type.errors) {
 // hover summary to see validation errors
 console.error(out.summary)
}
```

`.export()` is also useful in combination with the spread operator for extending your `Scope` s. Recall that a `Type`
can be referenced as a definition. This means that spreading a `Module` into the definition you pass to `scope` includes
all of that Module's aliases in your new `Scope`.

```

const threeSixtyNoScope = scope({
 three: "3",
 sixty: "60",
 no: "'no'"
})

const superScope = scope({
 ...coolScope.export(),
 // if you don't want to include the entire scope, you can pass a list of ...aliases
 ...threeSixtyNoScope.export("three", "sixty"),
 saiyan: {
  powerLevel: "number > 9000"
 }
})
```

If you don't plan to reuse your `Scope` to create additional types, it is common to export it inline:

```
const ezModule = scope({
 Ez: "'moochi'"
}).export()
```

`type.module` is available as sugar for this pattern:

```
const ezModule = type.module({
 Ez: "'moochi'"
})
```

### [Cyclic Types](https://arktype.io/docs/scopes#cyclic-types)

Scopes make it easy to create recursive `Type` s. Just reference the alias like you would any other:

```
export const types = scope({
 Package: {
  name: "string",
  "dependencies?": "Package[]",
  "contributors?": "Contributor[]"
 },
 Contributor: {
  email: "string.email",
  "packages?": "Package[]"
 }
}).export()
```

Cyclic types are inferred to arbitrary depth. At runtime, they can safely validate cyclic data.

```

export type Package = typeof types.Package.infer

const packageData: Package = {
 name: "arktype",
 dependencies: [{ name: "typescript" }],
 contributors: [{ email: "david@sharktypeio" }]
}

// update arktype to depend on itself
packageData.dependencies![0].dependencies = [packageData]

// ArkErrors: contributors[0].email must be an email address (was "david@sharktypeio")
const out = types.Package(packageData)
```

Some \`any\`s are not what they seem!

By default, TypeScript represents anonymous cycles as `...`. However, if you have `noErrorTruncation` enabled, they are
visually displayed as `any` 😬

Luckily, despite its appearance, the type otherwise behaves as you'd expect- TypeScript will provide completions and
will complain as normal if you access a non-existent property.

### [visibility](https://arktype.io/docs/scopes#visibility)

Intermediate aliases can be useful for composing Scoped definitions from aliases. Sometimes, you may not want to expose
those aliases externally as `Type` s when your `Scope` is `export` ed.

This can be done using _private_ aliases:

```
const shapeScope = scope({
 // aliases with a "#" prefix are treated as private
 "#BaseShapeProps": {
  perimeter: "number",
  area: "number"
 },
 Ellipse: {
  // when referencing a private alias, the "#" should not be included
  "...": "BaseShapeProps",
  radii: ["number", "number"]
 },
 Rectangle: {
  "...": "BaseShapeProps",
  width: "number",
  height: "number"
 }
})

// private aliases can be referenced from any scoped definition,
// even outside the original scope
const PartialShape = shapeScope.type("Partial<BaseShapeProps>")

// when the scope is exported to a Module, they will not be included
// hover to see the Scope's exports
const shapeModule = shapeScope.export()
```

#### [`import()`](https://arktype.io/docs/scopes#import)

Private aliases are especially useful for building scopes without polluting them with every alias you might want to
reference internally. To facilitate this, Scopes have an `import()` method that behaves identically to `export()` but
converts all exported aliases to `private`.

```
const utilityScope = scope({
 "withId<o extends object>": {
  "...": "o",
  id: "string"
 }
})

const userModule = type.module({
 // because we use `import()` here, we can reference our utilities
 // internally, but they will not be included in `userModule`.
 // if we used `export()` instead, `withId` could be accessed on `userModule`.
 ...utilityScope.import(),
 Payload: {
  name: "string",
  age: "number"
 },
 db: "withId<Payload>"
})
```

### [submodules](https://arktype.io/docs/scopes#submodules)

If you've used keywords like `string.email` or `number.integer`, you may wonder if aliases can be grouped in your own
Scopes. Recall from [the introduction to Scopes](https://arktype.io/docs/scopes#intro) that `type` is actually just a
method on ArkType's default `Scope`, meaning all of its functionality is available externally, including alias groups
called _Submodules_.

Submodules are groups of aliases with a shared prefix. To define one, just assign the value of the prefix to a `Module`
with the names you want:

```
const subAliases = type.module({ alias: "number" })

const rootScope = scope({
 a: "string",
 b: "sub.alias",
 sub: subAliases
})

const myType = rootScope.type({
 someKey: "sub.alias[]"
})
```

Submodules are parsed bottom-up. This means subaliases can be referenced directly in the root scope, but root aliases
can't be referenced from the submodule, even if it's inlined.

#### [nested](https://arktype.io/docs/scopes#nested)

Submodules can be nested to arbitrary depth:

```

const rootScopeSquared = scope({
 // reference rootScope from our previous example
 newRoot: rootScope.export()
})

const myNewType = rootScopeSquared.type({
 someOtherKey: "newRoot.sub.alias | boolean"
})
```

#### [rooted](https://arktype.io/docs/scopes#rooted)

The Submodules from our previous examples group `Type` s together, but cannot be referenced as `Type` s themselves the
way `string` and `number` can. To define a _Rooted Submodule_, just use an alias called `root`:

```
const userModule = type.module({
 root: {
  name: "string"
 },
 // subaliases can extend a base type by referencing 'root'
 // like any other alias
 Admin: {
  "...": "root",
  isAdmin: "true"
 },
 Saiyan: {
  "...": "root",
  powerLevel: "number > 9000"
 }
})

const types = type.module({
 User: userModule,
 // user can now be referenced directly in a definition
 Group: "User[]",
 // or used as a prefix to access subaliases
 ElevatedUser: "User.Admin | User.Saiyan"
})
```

### [thunks](https://arktype.io/docs/scopes#thunks)

When users are first learning about Scopes, one of the most common mistakes is to reference an alias in a nested `type`
call:

```
const myScope = scope({
 id: "string#id",
 user: type({
  name: "string",
  id: "id"
TypeScript: 'id' is unresolvable  })
})
```

This error occurs because although the `id` alias would be resolvable in the current Scope directly, `type` only allows
references to built-in keywords. In this case, the `type` wrapper is redundant and the fix is to simply remove it:

```
const myScope = scope({
 Id: "string#id",
 User: {
  name: "string",
  // now resolves correctly
  id: "Id"
 }
})
```

However, even if it is _possible_ to define your scope without invoking `type` by composing aliases and tuple
expressions, the fluent methods available on `Type` can define complex types that can be cumbersome to express
otherwise. In these situations, you can use a **thunk definition** to access the `type` method on the Scope you're
currently defining:

```
const $ = scope({
 Id: "string#id",
 expandUserGroup: () =>
  $.type({
   name: "string",
   id: "Id"
  })
   .or("Id")
   .pipe(user =>
    typeof user === "string" ? { id: user, name: "Anonymous" } : user
   )
   .array()
   .atLeastLength(2)
})

const types = $.export()

// input is validated and transformed to:
// [{ name: "Magical Crawdad", id: "777" }, { name: "Anonymous", id: "778" }]
const groups = types.expandUserGroup([\
 { name: "Magical Crawdad", id: "777" },\
 "778"\
])
```

Though thunk definitions are really only useful when defining a Scope, they can be used anywhere a `Type` definition is
expected:

```
// you *can* use them anywhere, but *should* you? (no)
const MyInelegantType = type(() =>
 type({ inelegantKey: () => type("'inelegant value'") })
)
```

[hono\\ \\ Previous Page](https://arktype.io/docs/integrations#hono)
[modules\\ \\ Next Page](https://arktype.io/docs/scopes#modules)

### On this page

[Defining a Scope](https://arktype.io/docs/scopes#defining-a-scope)
[Cyclic Types](https://arktype.io/docs/scopes#cyclic-types) [visibility](https://arktype.io/docs/scopes#visibility)
[`import()`](https://arktype.io/docs/scopes#import) [submodules](https://arktype.io/docs/scopes#submodules)
[nested](https://arktype.io/docs/scopes#nested) [rooted](https://arktype.io/docs/scopes#rooted)
[thunks](https://arktype.io/docs/scopes#thunks)
