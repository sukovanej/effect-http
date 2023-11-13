import { Schema } from "@effect/schema";
import { Effect, Predicate, pipe } from "effect";
import { Api, NodeServer, RouterBuilder, ServerError } from "effect-http";

import { debugLogger } from "./_utils";

const api = pipe(
  Api.api(),
  Api.post("upload", "/upload", {
    request: {
      body: Api.FormData,
    },
    response: Schema.string,
  }),
);

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("upload", ({ body }) => {
    const file = body.get("file");

    if (file === null) {
      return Effect.fail(ServerError.invalidBodyError('Expected "file"'));
    }

    if (Predicate.isString(file)) {
      return Effect.fail(ServerError.invalidBodyError("Expected file"));
    }

    return pipe(
      Effect.promise(() => file.text()),
      Effect.map((content) => `Received file with content: ${content}`),
    );
  }),
  RouterBuilder.build,
);

const program = pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(debugLogger),
);

Effect.runPromise(program);
