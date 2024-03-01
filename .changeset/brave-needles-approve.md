---
"effect-http-node": minor
"effect-http": minor
---

Added `docsPath` option to `RouterBuilder.Options`. The standalone `SwaggerRouter` now serves files from `/` instead of `/docs` and it is expected the user-land code will mount the router. Fixed SwaggerRouter prefix path resolving - now it works with both `HttpServer.router.mount` and `HttpServer.router.mountApp`.
