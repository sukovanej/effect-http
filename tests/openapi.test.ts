import { Schema } from "@effect/schema";
import { pipe } from "effect";
import { Api, OpenApi } from "effect-http";

test("description", () => {
  const api = pipe(
    Api.api(),
    Api.put(
      "myOperation",
      "/my-operation",
      { response: Schema.string },
      { description: "my description" },
    ),
  );

  const openApi = OpenApi.openApi(api);

  expect(openApi.paths["/my-operation"].put?.description).toEqual(
    "my description",
  );
});
