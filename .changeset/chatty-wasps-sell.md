---
"effect-http": minor
---

Multiple responses, response headers, client input type fixes.

This release allows to specify different status codes to return different responses and headers.

```ts
const api = pipe(
  Http.api(),
  Http.post("hello", "/hello", {
    response: [
      {
        status: 201,
        content: Schema.number,
      },
      {
        status: 200,
        content: Schema.number,
        headers: {
          "X-Another-200": Schema.NumberFromString,
        },
      },
      {
        status: 204,
        headers: { "X-Another": Schema.string },
      },
    ],
  }),
);
```

Specified response combinations are propagated to the OpenApi.

The generated client in case of multiple responses returns an
object `{ status, content, headers }`, the proper union type is
generated in that case.
