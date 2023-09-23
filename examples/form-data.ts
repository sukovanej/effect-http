import * as Schema from "@effect/schema/Schema";
import { Effect, Predicate, pipe } from "effect";
import * as Http from "effect-http";

import { debugLogger } from "./_utils";

const api = pipe(
  Http.api(),
  Http.post("upload", "/upload", {
    request: {
      body: Http.FormData,
    },
    response: Schema.string,
  }),
);

const server = pipe(
  Http.server(api),
  Http.handle("upload", ({ body }) => {
    const file = body.get("file");

    if (file === null) {
      return Effect.fail(Http.invalidBodyError('Expected "file"'));
    }

    if (Predicate.isString(file)) {
      return Effect.fail(Http.invalidBodyError("Expected file"));
    }

    return pipe(
      Effect.promise(() => file.text()),
      Effect.map((content) => `Received file with content: ${content}`),
    );
  }),
);

const program = pipe(
  server,
  Http.listen({ port: 3000 }),
  Effect.provide(debugLogger),
);

Effect.runPromise(program);
