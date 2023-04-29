import * as Http from "effect-http";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

const api = pipe(
  Http.api(),
  Http.get("stuff", "/stuff", { response: Schema.string }),
);

const server = pipe(
  api,
  Http.server,
  Http.handle("stuff", () => Effect.succeed("stuff")),
  Http.exhaustive,
);

const myValidationErrorFormatter: Http.ValidationErrorFormatter = (error) =>
  JSON.stringify(error);

pipe(
  server,
  Http.listen({ port: 3000 }),
  Effect.provideSomeLayer(
    Http.setValidationErrorFormatter(myValidationErrorFormatter),
  ),
  Effect.runPromise,
);
