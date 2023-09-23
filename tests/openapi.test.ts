import { Schema } from "@effect/schema";
import { pipe } from "effect";
import * as Http from "effect-http";

test("description", () => {
  const api = pipe(
    Http.api(),
    Http.put(
      "myOperation",
      "/my-operation",
      { response: Schema.string },
      { description: "my description" },
    ),
  );

  const openApi = Http.openApi(api);

  expect(openApi.paths["/my-operation"].put?.description).toEqual(
    "my description",
  );
});
