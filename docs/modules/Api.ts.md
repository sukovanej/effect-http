---
title: Api.ts
nav_order: 1
parent: Modules
---

## Api overview

`Api` represents the API specification. It doesn't hold information concerning the
server or client side details. An instance of `Api` can be used to derive a client
implementation (see `Client.ts`).

The generated type of the `Api` is used during server implementation. The type safety
guarantees the server-side implementation and the `Api` specification are compatible.

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
  - [Api (type alias)](#api-type-alias)
  - [ApiGroup (type alias)](#apigroup-type-alias)
  - [Endpoint (interface)](#endpoint-interface)
  - [EndpointOptions (interface)](#endpointoptions-interface)
  - [EndpointSetter (type alias)](#endpointsetter-type-alias)
  - [InputSchemas (type alias)](#inputschemas-type-alias)
  - [RecordOptionalSchema (type alias)](#recordoptionalschema-type-alias)
- [utils](#utils)
  - [AddEndpoint (type alias)](#addendpoint-type-alias)
  - [ComputeEndpoint (type alias)](#computeendpoint-type-alias)
  - [IgnoredSchemaId](#ignoredschemaid)
  - [IgnoredSchemaId (type alias)](#ignoredschemaid-type-alias)

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
export declare const delete: EndpointSetter
```

Added in v1.0.0

## get

**Signature**

```ts
export declare const get: EndpointSetter
```

Added in v1.0.0

## head

**Signature**

```ts
export declare const head: EndpointSetter
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
export declare const patch: EndpointSetter
```

Added in v1.0.0

## post

**Signature**

```ts
export declare const post: EndpointSetter
```

Added in v1.0.0

## put

**Signature**

```ts
export declare const put: EndpointSetter
```

Added in v1.0.0

## trace

**Signature**

```ts
export declare const trace: EndpointSetter
```

Added in v1.0.0

# models

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
  description?: string
}
```

Added in v1.0.0

## EndpointOptions (interface)

**Signature**

```ts
export interface EndpointOptions {
  description?: string
}
```

Added in v1.0.0

## EndpointSetter (type alias)

**Signature**

```ts
export type EndpointSetter = <
  const
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

# utils

## AddEndpoint (type alias)

**Signature**

```ts
export type AddEndpoint<A extends Api | ApiGroup, Id extends string, Schemas extends InputSchemas> = A extends Api<
  infer E
>
  ? Api<[...E, ComputeEndpoint<Id, Schemas>]>
  : A extends ApiGroup<infer E>
  ? ApiGroup<[...E, ComputeEndpoint<Id, Schemas>]>
  : never
```

Added in v1.0.0

## ComputeEndpoint (type alias)

**Signature**

```ts
export type ComputeEndpoint<Id extends string, I extends InputSchemas> = Schema.Spread<
  Endpoint<
    Id,
    I['response'] extends Schema.Schema<any, any> ? I['response'] : never,
    I['query'] extends Record<string, Schema.Schema<any>> ? I['query'] : IgnoredSchemaId,
    I['params'] extends Record<string, Schema.Schema<any>> ? I['params'] : IgnoredSchemaId,
    I['body'] extends Schema.Schema<any> ? I['body'] : IgnoredSchemaId,
    I['headers'] extends Record<string, Schema.Schema<any>>
      ? {
          [K in keyof I['headers'] as K extends string ? Lowercase<K> : never]: I['headers'][K]
        }
      : IgnoredSchemaId
  >
>
```

Added in v1.0.0

## IgnoredSchemaId

**Signature**

```ts
export declare const IgnoredSchemaId: typeof IgnoredSchemaId
```

Added in v1.0.0

## IgnoredSchemaId (type alias)

**Signature**

```ts
export type IgnoredSchemaId = typeof IgnoredSchemaId
```

Added in v1.0.0
