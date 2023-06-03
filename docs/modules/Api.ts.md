---
title: Api.ts
nav_order: 1
parent: Modules
---

## Api overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [addGroup](#addgroup)
- [constructors](#constructors)
  - [api](#api)
  - [apiGroup](#apigroup)
- [methods](#methods)
  - [delete](#delete)
  - [get](#get)
  - [head](#head)
  - [options](#options)
  - [patch](#patch)
  - [post](#post)
  - [put](#put)
  - [trace](#trace)
- [models](#models)
  - [AnyApi (type alias)](#anyapi-type-alias)
  - [Api (type alias)](#api-type-alias)
  - [ApiGroup (type alias)](#apigroup-type-alias)
  - [Endpoint (interface)](#endpoint-interface)
  - [InputSchemas (type alias)](#inputschemas-type-alias)
  - [RecordOptionalSchema (type alias)](#recordoptionalschema-type-alias)

---

# combinators

## addGroup

Merge the Api `Group` with an `Api`

**Signature**

```ts
export declare const addGroup: <E2 extends Endpoint<string, any, any, any, any, any>[]>(
  apiGroup: ApiGroup<E2>
) => <E1 extends Endpoint<string, any, any, any, any, any>[]>(api: Api<E1>) => Api<[...E1, ...E2]>
```

Added in v1.0.0

# constructors

## api

**Signature**

```ts
export declare const api: (options?: Partial<{ title: string; version: string }> | undefined) => Api<[]>
```

Added in v1.0.0

## apiGroup

Create new API group with a given name

**Signature**

```ts
export declare const apiGroup: (groupName: string) => ApiGroup<[]>
```

Added in v1.0.0

# methods

## delete

**Signature**

```ts
export declare const delete: any
```

Added in v1.0.0

## get

**Signature**

```ts
export declare const get: any
```

Added in v1.0.0

## head

**Signature**

```ts
export declare const head: any
```

Added in v1.0.0

## options

**Signature**

```ts
export declare const options: any
```

Added in v1.0.0

## patch

**Signature**

```ts
export declare const patch: any
```

Added in v1.0.0

## post

**Signature**

```ts
export declare const post: any
```

Added in v1.0.0

## put

**Signature**

```ts
export declare const put: any
```

Added in v1.0.0

## trace

**Signature**

```ts
export declare const trace: any
```

Added in v1.0.0

# models

## AnyApi (type alias)

**Signature**

```ts
export type AnyApi = Api<Endpoint[]>
```

Added in v1.0.0

## Api (type alias)

**Signature**

```ts
export type Api<E extends Endpoint[] = Endpoint[]> = {
  endpoints: E
  options: {
    title: string
    version: string
  }
}
```

Added in v1.0.0

## ApiGroup (type alias)

**Signature**

```ts
export type ApiGroup<E extends Endpoint[] = Endpoint[]> = {
  endpoints: E
  groupName: string
}
```

Added in v1.0.0

## Endpoint (interface)

**Signature**

```ts
export interface Endpoint<
  Id extends string = string,
  Response = any,
  Query = any,
  Params = any,
  Body = any,
  Headers = any
> {
  id: Id
  path: string
  method: OpenApi.OpenAPISpecMethodName
  schemas: {
    response: Response
    query: Query
    params: Params
    body: Body
    headers: Headers
  }
  groupName: string
}
```

Added in v1.0.0

## InputSchemas (type alias)

**Signature**

```ts
export type InputSchemas<
  Response = Schema.Schema<any>,
  Query = RecordOptionalSchema,
  Params = RecordOptionalSchema,
  Body = Schema.Schema<any> | undefined,
  Headers = RecordOptionalSchema
> = {
  response: Response
  query?: Query
  params?: Params
  body?: Body
  headers?: Headers
}
```

Added in v1.0.0

## RecordOptionalSchema (type alias)

**Signature**

```ts
export type RecordOptionalSchema = Record<string, Schema.Schema<any>> | undefined
```

Added in v1.0.0
