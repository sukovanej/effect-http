---
"effect-http-redoc": patch
---

Release of a new `effect-http-redoc` package. Install it using `pnpm add effect-http-redoc`.

You can use `RouterBuilder.mapRouter(HttpRouter.mount("/redoc", HttpRedoc.make(api)))` if
you're building the app using a `RouterBuilder`. If you're managing the router yourself,
simply use `HttpRouter.mount("/redoc", HttpRedoc.make(api))`.

The mounted router requires a `HttpRedoc.RedocFiles` service with preloaded redoc files. Use
the provided `HttpRedoc.RedocFilesLive`.
