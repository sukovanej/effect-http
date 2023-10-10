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
- [schemas](#schemas)
  - [FormData](#formdata)

---

# combinators

## addGroup

Merge the Api `Group` with an `Api`

**Signature**

```ts
export declare const addGroup: <E2 extends Endpoint[]>(
  apiGroup: ApiGroup<E2>
) => <E1 extends Endpoint[]>(api: Api<E1>) => Api<[...E1, ...E2]>
```

Added in v1.0.0

# constructors

## api

**Signature**

```ts
export declare const api: (options?: Partial<Api['options']>) => Api<[]>
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
export interface Api<E extends Endpoint[] = Endpoint[]> extends Pipeable.Pipeable {
  endpoints: E
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
export interface ApiGroup<E extends Endpoint[] = Endpoint[]> extends Pipeable.Pipeable {
  endpoints: E
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

# schemas

## FormData

FormData schema

**Signature**

```ts
export declare const FormData: Schema.Schema<FormData, FormData>
```

Added in v1.0.0
