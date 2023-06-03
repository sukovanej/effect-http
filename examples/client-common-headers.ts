import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

import * as Http from "effect-http";

const api = pipe(
  Http.api(),
  Http.get("test", "/test", {
    response: Schema.struct({ name: Schema.string }),
    headers: { AUTHORIZATION: Schema.string },
  }),
);

const client = pipe(
  api,
  Http.client(new URL("http://my-url"), {
    headers: {
      authorization: "Basic aGVsbG8gcGF0cmlrLCBob3cgYXJlIHlvdSB0b2RheQ==",
    },
  }),
);

// "x-my-header" can be provided to override the default but it's not necessary
pipe(client.test(), Effect.runPromise);
