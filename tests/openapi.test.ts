import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Schema from "@effect/schema/Schema";

test("basic auth", async () => {
  const api = pipe(
    Http.api(),
    Http.get("hello", "/hello", {
      response: Schema.string,
    }),
    Http.basicAuth,
  );

  const openapi = Http.openApi(api);

  expect(openapi).toEqual({});
});
