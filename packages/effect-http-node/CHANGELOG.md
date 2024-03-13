# effect-http-node

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
