import { Schema } from "@effect/schema";
import { pipe } from "effect";
import { Api } from "effect-http";

export const api = pipe(
  Api.api({ title: "My api" }),
  Api.get("stuff", "/stuff/:param", {
    response: Schema.struct({ value: Schema.number }),
    body: Schema.struct({ bodyField: Schema.array(Schema.string) }),
    query: { query: Schema.string },
    params: { param: Schema.string },
  }),
);
