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
  - [endpointClient](#endpointclient)
  - [make](#make)
- [models](#models)
  - [Client (type alias)](#client-type-alias)
  - [Options (interface)](#options-interface)

---

# constructors

## endpointClient

**Signature**

```ts
export declare const endpointClient: <Endpoints extends Api.Endpoint, Id extends Endpoints["id"]>(
  id: Id,
  api: Api.Api<Endpoints>,
  options: Partial<Options>
) => (
  input?: any
) => Effect.Effect<
  never,
  ClientError.ClientError,
  Types.Simplify<
    Extract<Endpoints, { id: Id }>["schemas"]["response"] extends Schema.Schema<any, infer A>
      ? A
      : Extract<Endpoints, { id: Id }>["schemas"]["response"] extends readonly Api.ResponseSchemaFull[]
        ? Route.ResponseSchemaFullTo<S[number]>
        : Extract<Endpoints, { id: Id }>["schemas"]["response"] extends Api.ResponseSchemaFull
          ? Route.ResponseSchemaFullTo<S>
          : never
  >
>
```

Added in v1.0.0

## make

Derive client implementation from the `Api`

**Signature**

```ts
export declare const make: <Endpoints extends Api.Endpoint>(
  api: Api.Api<Endpoints>,
  options?: Partial<Options>
) => Client<Endpoints>
```

Added in v1.0.0

# models

## Client (type alias)

**Signature**

```ts
export type Client<Endpoints extends Api.Endpoint> = {
  [Id in Endpoints["id"]]: EndpointClient<Extract<Endpoints, { id: Id }>>
}
```

Added in v1.0.0

## Options (interface)

**Signature**

```ts
export interface Options {
  mapRequest?: (request: ClientRequest.ClientRequest) => ClientRequest.ClientRequest
  httpClient?: HttpClient.Client.Default
  baseUrl: URL | string
}
```

Added in v1.0.0
