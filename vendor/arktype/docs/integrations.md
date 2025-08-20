---
title: 'Integrations'
source: https://arktype.io/docs/integrations
url: https://arktype.io/docs/integrations
---

[📈 Announcing ArkType 2.1 📈](https://arktype.io/docs/blog/2.1)

# Integrations

### [Standard Schema](https://arktype.io/docs/integrations#standard-schema)

ArkType is proud to support and co-author the new [Standard Schema](https://github.com/standard-schema/standard-schema)
API with [Valibot](https://github.com/fabian-hiller/valibot) and [Zod](https://github.com/colinhacks/zod).

Standard Schema allows you and your dependencies to integrate library-agnostic validation logic. If you're building or
maintaining a library with a peer dependency on ArkType and/or other validation libraries, we'd recommend consuming it
through Standard Schema's API if possible so that your users can choose the solution that best suits their needs!

### [tRPC](https://arktype.io/docs/integrations#trpc)

ArkType can easily be used with tRPC:

```
// trpc >= 11 accepts a Type directly
t.procedure.input(
 type({
  name: "string",
  "age?": "number"
 })
)

// tRPC < 11 accepts the `.assert` prop
t.procedure.input(
 type({
  name: "string",
  "age?": "number"
 }).assert
)
```

### [drizzle](https://arktype.io/docs/integrations#drizzle)

Drizzle maintains an official [`drizzle-arktype` package](https://orm.drizzle.team/docs/arktype) that can be used to
create Types for your Drizzle schemas.

```
import { pgTable, text, integer } from "drizzle-orm/pg-core"
import { createSelectSchema } from "drizzle-arktype"

const users = pgTable("users", {
 id: integer().generatedAlwaysAsIdentity().primaryKey(),
 name: text().notNull(),
 age: integer().notNull()
})

// Type<{ id: number; name: string; age: number }>
const User = createSelectSchema(users)
```

### [react-hook-form](https://arktype.io/docs/integrations#react-hook-form)

react-hook-form has built-in support for ArkType via
[`@hookform/resolvers`](https://github.com/react-hook-form/resolvers/tree/master):

```
import { useForm } from "react-hook-form"
import { arktypeResolver } from "@hookform/resolvers/arktype"
import { type } from "arktype"

const User = type({
 firstName: "string",
 age: "number.integer > 0"
})

// in your component
const {
 register,
 handleSubmit,
 formState: { errors }
} = useForm({
 resolver: arktypeResolver(User)
})
```

For a custom controlled input, you can pass the inferred type into the hook itself:

```
useForm<typeof User.infer>(/*...*/)
```

### [hono](https://arktype.io/docs/integrations#hono)

Hono has built-in support for ArkType via
[`@hono/arktype-validator`](https://github.com/honojs/middleware/tree/main/packages/arktype-validator):

```
const User = type({
 name: "string",
 age: "number"
})

app.post("/author", arktypeValidator("json", user), c => {
 const data = c.req.valid("json")
 return c.json({
  success: true,
  message: `${data.name} is ${data.age}`
 })
})
```

[`hono-openapi`](https://github.com/rhinobase/hono-openapi) also offers experimental support for OpenAPI docgen.

### [oRPC](https://arktype.io/docs/integrations#orpc)

[oRPC](https://orpc.unnoq.com/) has built-in support for Standard Schema, so ArkType works seamlessly right out of the
box:

```
os.input(
 type({
  name: "string",
  "age?": "number"
 })
)
```

[Traversal API\\ \\ Previous Page](https://arktype.io/docs/traversal-api)
[Standard Schema\\ \\ Next Page](https://arktype.io/docs/integrations#standard-schema)

### On this page

[Standard Schema](https://arktype.io/docs/integrations#standard-schema)
[tRPC](https://arktype.io/docs/integrations#trpc) [drizzle](https://arktype.io/docs/integrations#drizzle)
[react-hook-form](https://arktype.io/docs/integrations#react-hook-form)
[hono](https://arktype.io/docs/integrations#hono) [oRPC](https://arktype.io/docs/integrations#orpc)
