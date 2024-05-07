# effect-http-node

## 0.12.4

### Patch Changes

- [#555](https://github.com/sukovanej/effect-http/pull/555) [`0d8ce3b`](https://github.com/sukovanej/effect-http/commit/0d8ce3b79dc9f971f6f198ea0a5062f841491dc5) Thanks [@sukovanej](https://github.com/sukovanej)! - Refactor internal parsers / encoders.

- [#560](https://github.com/sukovanej/effect-http/pull/560) [`2673b0d`](https://github.com/sukovanej/effect-http/commit/2673b0d60bb8f5685229ec11019a8c733f73c6ae) Thanks [@sukovanej](https://github.com/sukovanej)! - Update @effect/platform.

- Updated dependencies [[`0d8ce3b`](https://github.com/sukovanej/effect-http/commit/0d8ce3b79dc9f971f6f198ea0a5062f841491dc5), [`2673b0d`](https://github.com/sukovanej/effect-http/commit/2673b0d60bb8f5685229ec11019a8c733f73c6ae)]:
  - effect-http@0.64.4

## 0.12.3

### Patch Changes

- [#551](https://github.com/sukovanej/effect-http/pull/551) [`cb22b08`](https://github.com/sukovanej/effect-http/commit/cb22b080b4dd7cb220a40e67796d5989055b9392) Thanks [@sukovanej](https://github.com/sukovanej)! - Update @effect/platform.

- Updated dependencies [[`cb22b08`](https://github.com/sukovanej/effect-http/commit/cb22b080b4dd7cb220a40e67796d5989055b9392)]:
  - effect-http@0.64.3

## 0.12.2

### Patch Changes

- [#549](https://github.com/sukovanej/effect-http/pull/549) [`71b7c27`](https://github.com/sukovanej/effect-http/commit/71b7c27fc4f484fa0418786fcb264a274fb8dfbc) Thanks [@sukovanej](https://github.com/sukovanej)! - Update effect.

- Updated dependencies [[`71b7c27`](https://github.com/sukovanej/effect-http/commit/71b7c27fc4f484fa0418786fcb264a274fb8dfbc)]:
  - effect-http@0.64.2

## 0.12.1

### Patch Changes

- Updated dependencies [[`307ec79`](https://github.com/sukovanej/effect-http/commit/307ec79ad4a09a4f03cf2f864b3a3464e74c56e5), [`52a651d`](https://github.com/sukovanej/effect-http/commit/52a651d8de5dfecff722d645505ab00bd04b4502)]:
  - effect-http@0.64.1

## 0.12.0

### Minor Changes

- [#539](https://github.com/sukovanej/effect-http/pull/539) [`4d1456f`](https://github.com/sukovanej/effect-http/commit/4d1456f4a928738fb1a456fb2e0b42d488ab7651) Thanks [@sukovanej](https://github.com/sukovanej)! - Add support for standalone handlers to allow an extraction of the handler logic.

  ```ts
  const myEndpointHandler = RouterBuilder.handler(
    api,
    "myEndpoint",
    ({ query }) => Effect.succeed(query.country),
  );

  const app = pipe(
    RouterBuilder.make(api),
    RouterBuilder.handle(myEndpointHandler),
    RouterBuilder.build,
  );
  ```

### Patch Changes

- Updated dependencies [[`4d1456f`](https://github.com/sukovanej/effect-http/commit/4d1456f4a928738fb1a456fb2e0b42d488ab7651), [`15b5a09`](https://github.com/sukovanej/effect-http/commit/15b5a0923adcda78ad7c3d463cde86f1bf40d3f8)]:
  - effect-http@0.64.0

## 0.11.0

### Minor Changes

- [#536](https://github.com/sukovanej/effect-http/pull/536) [`2881dea`](https://github.com/sukovanej/effect-http/commit/2881dea644b8002d357fc01ef5f0d2922f63267b) Thanks [@sukovanej](https://github.com/sukovanej)! - Remove `mapRequest` from `Client.make` options. Use `baseUrl` or `httpClient` options instead.

### Patch Changes

- Updated dependencies [[`2881dea`](https://github.com/sukovanej/effect-http/commit/2881dea644b8002d357fc01ef5f0d2922f63267b)]:
  - effect-http@0.63.0

## 0.10.1

### Patch Changes

- [#534](https://github.com/sukovanej/effect-http/pull/534) [`1f030d2`](https://github.com/sukovanej/effect-http/commit/1f030d237b94037636e86b375bc45f4d1c93defa) Thanks [@sukovanej](https://github.com/sukovanej)! - Update @effect/platform.

- Updated dependencies [[`1f030d2`](https://github.com/sukovanej/effect-http/commit/1f030d237b94037636e86b375bc45f4d1c93defa)]:
  - effect-http@0.62.1

## 0.10.0

### Minor Changes

- [#530](https://github.com/sukovanej/effect-http/pull/530) [`ef026aa`](https://github.com/sukovanej/effect-http/commit/ef026aa98792776a9d11b9e789570e6ecc9d3cae) Thanks [@sukovanej](https://github.com/sukovanej)! - Update to effect 3.0

### Patch Changes

- Updated dependencies [[`ef026aa`](https://github.com/sukovanej/effect-http/commit/ef026aa98792776a9d11b9e789570e6ecc9d3cae)]:
  - effect-http@0.62.0

## 0.9.1

### Patch Changes

- Updated dependencies [[`157cb6d`](https://github.com/sukovanej/effect-http/commit/157cb6db647f50f69daca5f682793255fec57812)]:
  - effect-http@0.61.1

## 0.9.0

### Minor Changes

- [#522](https://github.com/sukovanej/effect-http/pull/522) [`f50c467`](https://github.com/sukovanej/effect-http/commit/f50c467cf7848de6c151d3b159ca270b665d3470) Thanks [@sukovanej](https://github.com/sukovanej)! - Update effect.

### Patch Changes

- Updated dependencies [[`f50c467`](https://github.com/sukovanej/effect-http/commit/f50c467cf7848de6c151d3b159ca270b665d3470)]:
  - effect-http@0.61.0

## 0.8.8

### Patch Changes

- [#519](https://github.com/sukovanej/effect-http/pull/519) [`126a234`](https://github.com/sukovanej/effect-http/commit/126a234afcb1609caf0b59dfa65dbcc28746cc00) Thanks [@sukovanej](https://github.com/sukovanej)! - Update effect.

- Updated dependencies [[`126a234`](https://github.com/sukovanej/effect-http/commit/126a234afcb1609caf0b59dfa65dbcc28746cc00)]:
  - effect-http@0.60.7

## 0.8.7

### Patch Changes

- [#516](https://github.com/sukovanej/effect-http/pull/516) [`05f4ef3`](https://github.com/sukovanej/effect-http/commit/05f4ef30f257c289aad8f48ceb8ad63d3923196a) Thanks [@sukovanej](https://github.com/sukovanej)! - Update effect.

- [#513](https://github.com/sukovanej/effect-http/pull/513) [`70eee08`](https://github.com/sukovanej/effect-http/commit/70eee08e87b78bbd171b601f45e93368d915080f) Thanks [@sukovanej](https://github.com/sukovanej)! - Update @effect/platform and @effect/schema.

- Updated dependencies [[`05f4ef3`](https://github.com/sukovanej/effect-http/commit/05f4ef30f257c289aad8f48ceb8ad63d3923196a), [`70eee08`](https://github.com/sukovanej/effect-http/commit/70eee08e87b78bbd171b601f45e93368d915080f)]:
  - effect-http@0.60.6

## 0.8.6

### Patch Changes

- [#511](https://github.com/sukovanej/effect-http/pull/511) [`d92d062`](https://github.com/sukovanej/effect-http/commit/d92d062a9bd1c96097fe5eb9864337ebefc51d2a) Thanks [@sukovanej](https://github.com/sukovanej)! - Update swagger-ui-dist.

## 0.8.5

### Patch Changes

- [#509](https://github.com/sukovanej/effect-http/pull/509) [`cb6253a`](https://github.com/sukovanej/effect-http/commit/cb6253a3af65411e7ec5fac3e59a5c35a75c6298) Thanks [@sukovanej](https://github.com/sukovanej)! - Update effect.

- [#509](https://github.com/sukovanej/effect-http/pull/509) [`cb6253a`](https://github.com/sukovanej/effect-http/commit/cb6253a3af65411e7ec5fac3e59a5c35a75c6298) Thanks [@sukovanej](https://github.com/sukovanej)! - Deprecate `Middlewares.basicAUth`.

- Updated dependencies [[`cb6253a`](https://github.com/sukovanej/effect-http/commit/cb6253a3af65411e7ec5fac3e59a5c35a75c6298), [`cb6253a`](https://github.com/sukovanej/effect-http/commit/cb6253a3af65411e7ec5fac3e59a5c35a75c6298)]:
  - effect-http@0.60.5

## 0.8.4

### Patch Changes

- [#506](https://github.com/sukovanej/effect-http/pull/506) [`1a2bf5f`](https://github.com/sukovanej/effect-http/commit/1a2bf5fb09210b37f1208143b8ee8adebf217842) Thanks [@sukovanej](https://github.com/sukovanej)! - Update effect.

- Updated dependencies [[`1a2bf5f`](https://github.com/sukovanej/effect-http/commit/1a2bf5fb09210b37f1208143b8ee8adebf217842)]:
  - effect-http@0.60.4

## 0.8.3

### Patch Changes

- [#504](https://github.com/sukovanej/effect-http/pull/504) [`2874f89`](https://github.com/sukovanej/effect-http/commit/2874f89700963127c284589b6b209e02b26c44dc) Thanks [@sukovanej](https://github.com/sukovanej)! - Fix `ApiResponse.isFullResponse` - filter out non-2xx responses.

- Updated dependencies [[`2874f89`](https://github.com/sukovanej/effect-http/commit/2874f89700963127c284589b6b209e02b26c44dc), [`2874f89`](https://github.com/sukovanej/effect-http/commit/2874f89700963127c284589b6b209e02b26c44dc)]:
  - effect-http@0.60.3

## 0.8.2

### Patch Changes

- [#502](https://github.com/sukovanej/effect-http/pull/502) [`f15c472`](https://github.com/sukovanej/effect-http/commit/f15c4729dbaa7f0d0f9a9eb61f4facf86d175a1c) Thanks [@sukovanej](https://github.com/sukovanej)! - Update effect.

- Updated dependencies [[`f15c472`](https://github.com/sukovanej/effect-http/commit/f15c4729dbaa7f0d0f9a9eb61f4facf86d175a1c)]:
  - effect-http@0.60.2

## 0.8.1

### Patch Changes

- Updated dependencies [[`bf0f884`](https://github.com/sukovanej/effect-http/commit/bf0f884b3db88a166e525cbf4690ff603051a24a), [`bf0f884`](https://github.com/sukovanej/effect-http/commit/bf0f884b3db88a166e525cbf4690ff603051a24a)]:
  - effect-http@0.60.1

## 0.8.0

### Minor Changes

- [#497](https://github.com/sukovanej/effect-http/pull/497) [`37db9ad`](https://github.com/sukovanej/effect-http/commit/37db9ad8ea12df0d3f6562cce8319cf3f570a70c) Thanks [@sukovanej](https://github.com/sukovanej)! - New security API.

  The security was completely reworked to increase the flexibility how
  the server deals with authorization and authentication.

  The `SecurityScheme` module was removed and replaced by a new `Security` module.
  It exposes a new `Security<A, E, R>` type that captures the security handling
  and the OpenAPI specification. It also exposes a set of combinators that allow
  to combine `Security` specs and enhance them with arbitrary effectful computations.

  Before

  ```ts
  const api = Api.make().pipe(
    Api.addEndpoint(
      Api.post("mySecuredEndpoint", "/my-secured-endpoint").pipe(
        Api.setResponseBody(Schema.string),
        Api.addSecurity("mySecurity", {
          type: "http",
          options: {
            scheme: "basic",
          },
          schema: Schema.Secret,
        }),
      ),
    ),
  );
  ```

  After

  ```ts
  const api = Api.make().pipe(
    Api.addEndpoint(
      Api.post("mySecuredEndpoint", "/my-secured-endpoint").pipe(
        Api.setResponseBody(Schema.string),
        Api.setSecurity(Security.basic()),
      ),
    ),
  );
  ```

  The client was modified to support the new security API. The second security argument
  of endpoint methods was replaced by a general `(request: ClientRequest) => ClientRequest`
  mapping. `Client` exposes two new helper functions `Client.setBasic` and `Client.setBearer`.

  Before

  ```ts
  client.security({ ... }, { mySecurity: '...' })
  ```

  After

  ```ts
  client.endpoint({ ... }, Client.setBasic("user", "pass"))
  ```

  Please refer to the main readme for more information on the new security API.

### Patch Changes

- [#495](https://github.com/sukovanej/effect-http/pull/495) [`c765639`](https://github.com/sukovanej/effect-http/commit/c765639628cb416d0a165cc0012bd67a35ab0eb7) Thanks [@sukovanej](https://github.com/sukovanej)! - Update effect.

- Updated dependencies [[`c765639`](https://github.com/sukovanej/effect-http/commit/c765639628cb416d0a165cc0012bd67a35ab0eb7), [`37db9ad`](https://github.com/sukovanej/effect-http/commit/37db9ad8ea12df0d3f6562cce8319cf3f570a70c), [`7d65607`](https://github.com/sukovanej/effect-http/commit/7d65607aa64faea53bdd5952f9c5280be1d0c054)]:
  - effect-http@0.60.0

## 0.7.2

### Patch Changes

- [#492](https://github.com/sukovanej/effect-http/pull/492) [`cc35e22`](https://github.com/sukovanej/effect-http/commit/cc35e22744fa6a74f141f09032096a7a690e3d26) Thanks [@sukovanej](https://github.com/sukovanej)! - Update effect.

- Updated dependencies [[`cc35e22`](https://github.com/sukovanej/effect-http/commit/cc35e22744fa6a74f141f09032096a7a690e3d26)]:
  - effect-http@0.59.2

## 0.7.1

### Patch Changes

- [#489](https://github.com/sukovanej/effect-http/pull/489) [`aae259d`](https://github.com/sukovanej/effect-http/commit/aae259db0446c7097093cbc5040ad080e0a72bd0) Thanks [@sukovanej](https://github.com/sukovanej)! - Update effect dependencies.

- Updated dependencies [[`aae259d`](https://github.com/sukovanej/effect-http/commit/aae259db0446c7097093cbc5040ad080e0a72bd0)]:
  - effect-http@0.59.1

## 0.7.0

### Minor Changes

- [#482](https://github.com/sukovanej/effect-http/pull/482) [`4883b71`](https://github.com/sukovanej/effect-http/commit/4883b7143b8a358edceda13b248a31784ed877df) Thanks [@sukovanej](https://github.com/sukovanej)! - ## New pipeable API

  Overall, the API based on unnamed objects containing `response` and `request` fields
  was replaced by more strict and explicit pipeable API which constructs new `Api`, `ApiGroup`,
  `ApiEndpoint`, `ApiResponse` and `ApiRequest` objects under the hood.

  Before

  ```ts
  const api = pipe(
    Api.api({ title: "Users API" }),
    Api.get("getUser", "/user", {
      response: User,
      request: { query: GetUserQuery },
    }),
  );
  ```

  After

  ```ts
  const api = pipe(
    Api.make({ title: "Users API" }),
    Api.addEndpoint(
      pipe(
        Api.get("getUser", "/user"),
        Api.setResponseBody(UserResponse),
        Api.setRequestQuery(GetUserQuery),
      ),
    ),
  );
  ```

  ## Multiple-response endpoints changes

  The `content` field was renamed to `body`. So on the client side, an endpoint with multiple
  responses now returns an object `{ status; body; headers }` instead of `{ status; content; headers }`.
  The same on the server side, the handling function shall return the object with a `body` field
  instead of `content`.

  Also, with the new API, the _full response_ is applied only in case the there is a single response
  and it specifies headers or if there are multiple responses. So, in case the endpoint changes
  the response status, the client now returns the body only.

  ```ts
  const api = pipe(
    Api.make({ title: "Users API" }),
    Api.addEndpoint(
      pipe(
        Api.post("createUser", "/user"),
        Api.setResponseStatus(201),
        Api.setResponseBody(UserResponse),
      ),
    ),
  );

  const client = Client.make(api);
  client.createUser({}); // now returns `UserResponse` instead of `{ status: 201; body: UserResponse; headers? }`
  ```

  Multiple responses can be now defined using `Api.addResponse` / `ApiGroup.addResponse` combinators. They
  accept either a `ApiResponse` object (constructed using `ApiResponse.make`) or an object of shape
  `{ status; body?; headers? }`.

  ```ts
  const helloEndpoint = Api.post("hello", "/hello").pipe(
    // ApiResponse constructor
    Api.addResponse(ApiResponse.make(201, Schema.number)),
    // plain object
    Api.addResponse({
      status: 204,
      headers: Schema.struct({ "x-another": Schema.NumberFromString }),
    }),
  );
  ```

  ## Security

  The security was one of the reasons to introduce the new API. Previously, the way to declare
  an authorization for an endpoint was to specify it in the endpoint options. Now, it is part
  of the pipeable API.

  ```ts
  const mySecuredEnpoint = Api.post("security", "/testSecurity").pipe(
    Api.setResponseBody(Schema.string),
    Api.addSecurity("myAwesomeBearerAuth", mySecuritySchema),
  );

  const api = Api.make().pipe(Api.addEndpoint(mySecuredEnpoint));
  ```

### Patch Changes

- Updated dependencies [[`4883b71`](https://github.com/sukovanej/effect-http/commit/4883b7143b8a358edceda13b248a31784ed877df)]:
  - effect-http@0.59.0

## 0.6.2

### Patch Changes

- [#477](https://github.com/sukovanej/effect-http/pull/477) [`f7c3b10`](https://github.com/sukovanej/effect-http/commit/f7c3b101b7889f02ac44127655e37b06de2aa87c) Thanks [@KhraksMamtsov](https://github.com/KhraksMamtsov)! - split the ClientError into a union with two members

- [#479](https://github.com/sukovanej/effect-http/pull/479) [`2a5220b`](https://github.com/sukovanej/effect-http/commit/2a5220b0b584b1e9a411e363778d8ba0c01fe310) Thanks [@sukovanej](https://github.com/sukovanej)! - Update effect.

- Updated dependencies [[`d1d2f8c`](https://github.com/sukovanej/effect-http/commit/d1d2f8cce80bdafa44c4346dc60e428fd8727ea0), [`f7c3b10`](https://github.com/sukovanej/effect-http/commit/f7c3b101b7889f02ac44127655e37b06de2aa87c), [`2a5220b`](https://github.com/sukovanej/effect-http/commit/2a5220b0b584b1e9a411e363778d8ba0c01fe310)]:
  - effect-http@0.58.2

## 0.6.1

### Patch Changes

- [#474](https://github.com/sukovanej/effect-http/pull/474) [`40b4374`](https://github.com/sukovanej/effect-http/commit/40b4374e8e2295a0c7122c263989d9aef4558e57) Thanks [@sukovanej](https://github.com/sukovanej)! - Update schema-openapi.

- [#474](https://github.com/sukovanej/effect-http/pull/474) [`40b4374`](https://github.com/sukovanej/effect-http/commit/40b4374e8e2295a0c7122c263989d9aef4558e57) Thanks [@sukovanej](https://github.com/sukovanej)! - Update effect.

- Updated dependencies [[`40b4374`](https://github.com/sukovanej/effect-http/commit/40b4374e8e2295a0c7122c263989d9aef4558e57), [`40b4374`](https://github.com/sukovanej/effect-http/commit/40b4374e8e2295a0c7122c263989d9aef4558e57)]:
  - effect-http@0.58.1

## 0.6.0

### Minor Changes

- [#472](https://github.com/sukovanej/effect-http/pull/472) [`dadfb8c`](https://github.com/sukovanej/effect-http/commit/dadfb8c475e884b0b8947fa390f9545eb5703941) Thanks [@sukovanej](https://github.com/sukovanej)! - Update effect.

### Patch Changes

- Updated dependencies [[`dadfb8c`](https://github.com/sukovanej/effect-http/commit/dadfb8c475e884b0b8947fa390f9545eb5703941)]:
  - effect-http@0.58.0

## 0.5.3

### Patch Changes

- [#469](https://github.com/sukovanej/effect-http/pull/469) [`0d5e2fc`](https://github.com/sukovanej/effect-http/commit/0d5e2fcac69b0440559c8259b78735b3bc3284c2) Thanks [@sukovanej](https://github.com/sukovanej)! - Update dependencies.

- [#469](https://github.com/sukovanej/effect-http/pull/469) [`0d5e2fc`](https://github.com/sukovanej/effect-http/commit/0d5e2fcac69b0440559c8259b78735b3bc3284c2) Thanks [@sukovanej](https://github.com/sukovanej)! - Update namespace imports internally.

- Updated dependencies [[`0d5e2fc`](https://github.com/sukovanej/effect-http/commit/0d5e2fcac69b0440559c8259b78735b3bc3284c2), [`0d5e2fc`](https://github.com/sukovanej/effect-http/commit/0d5e2fcac69b0440559c8259b78735b3bc3284c2)]:
  - effect-http@0.57.3

## 0.5.2

### Patch Changes

- [#468](https://github.com/sukovanej/effect-http/pull/468) [`46c7693`](https://github.com/sukovanej/effect-http/commit/46c7693ff4725944ddbf0d68fa5f88b31f3cd3af) Thanks [@sukovanej](https://github.com/sukovanej)! - Update effect dependencies.

- [#465](https://github.com/sukovanej/effect-http/pull/465) [`ccf26f0`](https://github.com/sukovanej/effect-http/commit/ccf26f07af029fb9e1a37a3e1c09e9515f74a529) Thanks [@sukovanej](https://github.com/sukovanej)! - Update swagger-ui-dist.

- Updated dependencies [[`46c7693`](https://github.com/sukovanej/effect-http/commit/46c7693ff4725944ddbf0d68fa5f88b31f3cd3af)]:
  - effect-http@0.57.2

## 0.5.1

### Patch Changes

- [#463](https://github.com/sukovanej/effect-http/pull/463) [`f02d1b3`](https://github.com/sukovanej/effect-http/commit/f02d1b33ba8fdea117e179ef7828c1322eeca677) Thanks [@sukovanej](https://github.com/sukovanej)! - Update effect packages.

- Updated dependencies [[`f02d1b3`](https://github.com/sukovanej/effect-http/commit/f02d1b33ba8fdea117e179ef7828c1322eeca677)]:
  - effect-http@0.57.1

## 0.5.0

### Minor Changes

- [#461](https://github.com/sukovanej/effect-http/pull/461) [`8f4788a`](https://github.com/sukovanej/effect-http/commit/8f4788a7e497cdfa5a3f20828e48c26db523c123) Thanks [@sukovanej](https://github.com/sukovanej)! - Added `docsPath` option to `RouterBuilder.Options`. The standalone `SwaggerRouter` now serves files from `/` instead of `/docs` and it is expected the user-land code will mount the router. Fixed SwaggerRouter prefix path resolving - now it works with both `HttpServer.router.mount` and `HttpServer.router.mountApp`.

### Patch Changes

- Updated dependencies [[`8f4788a`](https://github.com/sukovanej/effect-http/commit/8f4788a7e497cdfa5a3f20828e48c26db523c123)]:
  - effect-http@0.57.0

## 0.4.1

### Patch Changes

- [#459](https://github.com/sukovanej/effect-http/pull/459) [`1635286`](https://github.com/sukovanej/effect-http/commit/1635286cfd54c3e2ace8dd86d7f2f9687740760e) Thanks [@sukovanej](https://github.com/sukovanej)! - Fix client handling of non-2xx response with not specified response.

- Updated dependencies [[`1635286`](https://github.com/sukovanej/effect-http/commit/1635286cfd54c3e2ace8dd86d7f2f9687740760e)]:
  - effect-http@0.56.1

## 0.4.0

### Minor Changes

- [#456](https://github.com/sukovanej/effect-http/pull/456) [`1cfc2f7`](https://github.com/sukovanej/effect-http/commit/1cfc2f737d5606c6670cec18a135cd6a67debd22) Thanks [@sukovanej](https://github.com/sukovanej)! - Allow to omit `response` to produce 204 No Content. Update @effect/schema.

### Patch Changes

- Updated dependencies [[`1cfc2f7`](https://github.com/sukovanej/effect-http/commit/1cfc2f737d5606c6670cec18a135cd6a67debd22)]:
  - effect-http@0.56.0

## 0.3.1

### Patch Changes

- [#454](https://github.com/sukovanej/effect-http/pull/454) [`bcd2606`](https://github.com/sukovanej/effect-http/commit/bcd2606883cec2167e27c5e02a15654df008dea6) Thanks [@sukovanej](https://github.com/sukovanej)! - Update @effect/platform dependencies.

- Updated dependencies [[`bcd2606`](https://github.com/sukovanej/effect-http/commit/bcd2606883cec2167e27c5e02a15654df008dea6)]:
  - effect-http@0.55.1

## 0.3.0

### Minor Changes

- [#452](https://github.com/sukovanej/effect-http/pull/452) [`7577e3b`](https://github.com/sukovanej/effect-http/commit/7577e3ba3f6c26803708fe0abc95ae7386af1dfb) Thanks [@sukovanej](https://github.com/sukovanej)! - Update effect.

### Patch Changes

- Updated dependencies [[`7577e3b`](https://github.com/sukovanej/effect-http/commit/7577e3ba3f6c26803708fe0abc95ae7386af1dfb)]:
  - effect-http@0.55.0

## 0.2.3

### Patch Changes

- [#450](https://github.com/sukovanej/effect-http/pull/450) [`94464e2`](https://github.com/sukovanej/effect-http/commit/94464e2c143a4e4e874ff769be357cdc8776cd18) Thanks [@sukovanej](https://github.com/sukovanej)! - Fix: remove `Scope` from client response effects. Scope is resolved internally.

- Updated dependencies [[`94464e2`](https://github.com/sukovanej/effect-http/commit/94464e2c143a4e4e874ff769be357cdc8776cd18)]:
  - effect-http@0.54.2

## 0.2.2

### Patch Changes

- [#448](https://github.com/sukovanej/effect-http/pull/448) [`549859b`](https://github.com/sukovanej/effect-http/commit/549859b06b426d1a97723c430a755e0777ae97cc) Thanks [@sukovanej](https://github.com/sukovanej)! - Update effect dependencies.

- Updated dependencies [[`549859b`](https://github.com/sukovanej/effect-http/commit/549859b06b426d1a97723c430a755e0777ae97cc)]:
  - effect-http@0.54.1

## 0.2.1

### Patch Changes

- Updated dependencies [[`5942f84`](https://github.com/sukovanej/effect-http/commit/5942f840322d8df764d4c74da1229628d72aca9d)]:
  - effect-http@0.54.0

## 0.2.0

### Minor Changes

- [#440](https://github.com/sukovanej/effect-http/pull/440) [`2d17f7c`](https://github.com/sukovanej/effect-http/commit/2d17f7cc073e4fd7b5403e58eeebb9288100245b) Thanks [@sukovanej](https://github.com/sukovanej)! - Move swagger-ui-dist to effect-http-node.

### Patch Changes

- [#440](https://github.com/sukovanej/effect-http/pull/440) [`2d17f7c`](https://github.com/sukovanej/effect-http/commit/2d17f7cc073e4fd7b5403e58eeebb9288100245b) Thanks [@sukovanej](https://github.com/sukovanej)! - Update @effect/platform packages.

- Updated dependencies [[`2d17f7c`](https://github.com/sukovanej/effect-http/commit/2d17f7cc073e4fd7b5403e58eeebb9288100245b), [`2d17f7c`](https://github.com/sukovanej/effect-http/commit/2d17f7cc073e4fd7b5403e58eeebb9288100245b)]:
  - effect-http@0.53.0

## 0.1.0

### Minor Changes

- [#432](https://github.com/sukovanej/effect-http/pull/432) [`13b1f3d`](https://github.com/sukovanej/effect-http/commit/13b1f3ddbb1c76a61b51385661f157423b2b4d4f) Thanks [@sukovanej](https://github.com/sukovanej)! - Rename `Testing` -> `NodeTesting`.

### Patch Changes

- Updated dependencies [[`6641c91`](https://github.com/sukovanej/effect-http/commit/6641c911b40d92931cf6fe60afc1932e2529f823)]:
  - effect-http@0.52.0
