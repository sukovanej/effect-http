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
  - [Api (interface)](#api-interface)
  - [ApiGroup (interface)](#apigroup-interface)
  - [Endpoint (interface)](#endpoint-interface)
  - [EndpointOptions (interface)](#endpointoptions-interface)
  - [EndpointSchemas (interface)](#endpointschemas-interface)
  - [InputEndpointSchemas (interface)](#inputendpointschemas-interface)
- [refinements](#refinements)
  - [isApi](#isapi)
  - [isApiGroup](#isapigroup)
- [schemas](#schemas)
  - [FormData](#formdata)
- [type id](#type-id)
  - [ApiGroupTypeId](#apigrouptypeid)
  - [ApiGroupTypeId (type alias)](#apigrouptypeid-type-alias)
  - [ApiTypeId](#apitypeid)
  - [ApiTypeId (type alias)](#apitypeid-type-alias)
- [utils](#utils)
  - [getEndpoint](#getendpoint)

---

# combinators

## addGroup

Merge the Api `Group` with an `Api`

**Signature**

```ts
export declare const addGroup: <E2 extends Endpoint>(
  apiGroup: ApiGroup<E2>
) => <E1 extends Endpoint>(api: Api<E1>) => Api<E2 | E1>
```

Added in v1.0.0

# constructors

## api

**Signature**

```ts
export declare const api: (options?: Partial<Api["options"]>) => Api<never>
```

Added in v1.0.0

## apiGroup

Create new API group with a given name

**Signature**

```ts
export declare const apiGroup: (groupName: string) => ApiGroup<never>
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
export declare const options: EndpointSetter
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

## Api (interface)

**Signature**

```ts
export interface Api<E extends Endpoint = Endpoint> extends Pipeable.Pipeable {
  [ApiTypeId]: ApiTypeId
  endpoints: E[]
  options: {
    title: string
    version: string
  }
}
```

Added in v1.0.0

## ApiGroup (interface)

**Signature**

```ts
export interface ApiGroup<E extends Endpoint = Endpoint> extends Pipeable.Pipeable {
  [ApiGroupTypeId]: ApiGroupTypeId
  endpoints: E[]
  groupName: string
}
```

Added in v1.0.0

## Endpoint (interface)

**Signature**

```ts
export interface Endpoint {
  id: string
  path: string
  method: OpenApi.OpenAPISpecMethodName
  schemas: EndpointSchemas
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

## EndpointSchemas (interface)

**Signature**

```ts
export interface EndpointSchemas {
  response: AnySchema | ResponseSchemaFull | readonly ResponseSchemaFull[]
  request: {
    query: AnySchema | IgnoredSchemaId
    params: AnySchema | IgnoredSchemaId
    body: AnySchema | IgnoredSchemaId
    headers: AnySchema | IgnoredSchemaId
  }
}
```

Added in v1.0.0

## InputEndpointSchemas (interface)

**Signature**

```ts
export interface InputEndpointSchemas {
  response: InputResponseSchemaFull | readonly InputResponseSchemaFull[] | AnySchema
  request?: {
    query?: AnySchema
    params?: AnySchema
    body?: AnySchema
    headers?: AnySchema
  }
}
```

Added in v1.0.0

# refinements

## isApi

**Signature**

```ts
export declare const isApi: (u: unknown) => u is Api<any>
```

Added in v1.0.0

## isApiGroup

**Signature**

```ts
export declare const isApiGroup: (u: unknown) => u is ApiGroup<any>
```

Added in v1.0.0

# schemas

## FormData

FormData schema

**Signature**

```ts
export declare const FormData: Schema.Schema<FormData, FormData>
```

Added in v1.0.0

# type id

## ApiGroupTypeId

**Signature**

```ts
export declare const ApiGroupTypeId: typeof ApiGroupTypeId
```

Added in v1.0.0

## ApiGroupTypeId (type alias)

**Signature**

```ts
export type ApiGroupTypeId = typeof ApiGroupTypeId
```

Added in v1.0.0

## ApiTypeId

**Signature**

```ts
export declare const ApiTypeId: typeof ApiTypeId
```

Added in v1.0.0

## ApiTypeId (type alias)

**Signature**

```ts
export type ApiTypeId = typeof ApiTypeId
```

Added in v1.0.0

# utils

## getEndpoint

**Signature**

```ts
export declare const getEndpoint: <A extends Api<Endpoint>, Id extends A["endpoints"][number]["id"]>(
  api: A,
  id: Id
) => Extract<A["endpoints"][number], { id: Id }>
```

Added in v1.0.0
