---
"effect-http": minor
---

Rewrite endpoint handling using `Runtime`.

- `Http.express`, `Http.listen` and new `Http.listenExpress` functions now
  return `Effect` instead of promise.
- Options object of `Http.express` was extended by `validationErrorFormatter` field
  that configures how are HTTP validation errors formatted.
- `Http.listen` and `Http.listenExpress` options object was extended by
  `port` and `logger` fields.
- `Http.setLogger` was removed in favor of the configuration above.
- `Http.provideService` and `Http.provideLayer` were removed because the context
  is now propagated from the top-level effect. Simply provide the context for the
  app effect instead. Also, scoped services are now guaranteed to be safely released
  when the whole app closes - currently, on SIGTERM and SIGINT signals.

```typescript
pipe(
  server,
  Http.listen({ port: 3000 }),
  Effect.provideLayer(layer),
  Effect.runPromise,
);
```
