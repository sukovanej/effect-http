---
title: MockClient.ts
nav_order: 7
parent: Modules
---

## MockClient overview

`Client` implementation derivation for testing purposes.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [mockClient](#mockclient)
- [models](#models)
  - [MockClientOptions (type alias)](#mockclientoptions-type-alias)

---

# constructors

## mockClient

Derive mock client implementation from the `Api`

**Signature**

```ts
export declare const mockClient: <Endpoints extends Api.Endpoint>(
  api: Api.Api<Endpoints>,
  option?: Partial<MockClientOptions<Endpoints>> | undefined
) => Client.Client<Endpoints>
```

Added in v1.0.0

# models

## MockClientOptions (type alias)

**Signature**

```ts
export type MockClientOptions<Endpoints extends Api.Endpoint> = {
  responses: {
    [Id in Endpoints["id"]]: Client.ClientFunctionResponse<Extract<Endpoints, { id: Id }>["schemas"]["response"]>
  }
}
```

Added in v1.0.0
