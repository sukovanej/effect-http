import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

import * as Http from "effect-http";

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
        headers: Schema.struct({
          "My-Header": pipe(
            Schema.NumberFromString,
            Schema.description("My header"),
          ),
        }),
      },
      {
        status: 204,
        headers: Schema.struct({ "X-Another": Schema.NumberFromString }),
      },
    ],
    request: {
      headers: Schema.struct({
        "User-Agent": pipe(
          Schema.NumberFromString,
          Schema.description("Identifier of the user"),
        ),
      }),
    },
  }),
);

const server = pipe(
  Http.server(api),
  Http.handle("hello", ({ ResponseUtil }) =>
    Effect.succeed(
      ResponseUtil.response200({ content: 12, headers: { "my-header": 69 } }),
    ),
  ),
);

const HelloResponseUtil = Http.responseUtil(api, "hello");
const response200 = HelloResponseUtil.response200({
  headers: { "my-header": 12 },
  content: 12,
});
console.log(response200);

pipe(server, Http.listen({ port: 3000 }), Effect.runPromise);
