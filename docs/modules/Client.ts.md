---
title: Client.ts
nav_order: 2
parent: Modules
---

## Client overview

This module exposes the `client` combinator which accepts an `Api` instance
and it generates a client-side implementation. The generated implementation
is type-safe and guarantees compatibility of the client and server side.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [client](#client)
  - [endpointClient](#endpointclient)
- [models](#models)
  - [Client (type alias)](#client-type-alias)
  - [Options (interface)](#options-interface)

---

# constructors

## client

Derive client implementation from the `Api`

**Signature**

```ts
export declare const client: <Endpoints extends Api.Endpoint>(
  api: Api.Api<Endpoints>,
  options?: Partial<Options>
) => Client<Endpoints>
```

Added in v1.0.0

## endpointClient

**Signature**

```ts
export declare const endpointClient: <Endpoints extends Api.Endpoint, Id extends Endpoints["id"]>(
  id: Id,
  api: Api.Api<Endpoints>,
  options: Partial<Options>
) => ClientFunction<
  Endpoints,
  Id,
  MakeHeadersOptionIfAllPartial<{
    [K in Extract<
      keyof Extract<Endpoints, { id: Id }>["schemas"]["request"],
      {
        [K in keyof Extract<Endpoints, { id: Id }>["schemas"]["request"]]: Extract<
          Endpoints,
          { id: Id }
        >["schemas"]["request"][K] extends typeof Api.IgnoredSchemaId
          ? never
          : K
      }[keyof Extract<Endpoints, { id: Id }>["schemas"]["request"]]
    >]: SchemaTo<Extract<Endpoints, { id: Id }>["schemas"]["request"][K]>
  }>
>
```

Added in v1.0.0

# models

## Client (type alias)

**Signature**

```ts
export type Client<Endpoints extends Api.Endpoint> = {
  [Id in Endpoints["id"]]: EndpointClient<Endpoints, Id>
} & Pipeable.Pipeable
```

Added in v1.0.0

## Options (interface)

**Signature**

```ts
export interface Options {
  mapRequest?: (request: ClientRequest.ClientRequest) => ClientRequest.ClientRequest
  baseUrl: URL | string
}
```

Added in v1.0.0
