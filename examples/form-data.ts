import { FileSystem } from "@effect/platform";
import { HttpServer, NodeContext } from "@effect/platform-node";
import { runMain } from "@effect/platform-node/Runtime";
import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import {
  Api,
  HttpSchema,
  NodeServer,
  Representation,
  RouterBuilder,
  ServerError,
} from "effect-http";

import { debugLogger } from "./_utils";

const api = pipe(
  Api.api(),
  Api.post("upload", "/upload", {
    request: {
      body: HttpSchema.FormData,
    },
    response: {
      content: Schema.string,
      status: 200,
      representations: [Representation.plainText],
    },
  }),
);

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("upload", () =>
    Effect.gen(function* (_) {
      const request = yield* _(HttpServer.request.ServerRequest);
      const formData = yield* _(request.formData);

      const file = formData["file"];

      if (typeof file === "string") {
        return yield* _(ServerError.badRequest('Expected "file"'));
      }

      const fs = yield* _(FileSystem.FileSystem);
      const content = yield* _(fs.readFileString(file[0].path));

      return { content, status: 200 as const };
    }).pipe(Effect.scoped),
  ),
  RouterBuilder.build,
);

pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(debugLogger),
  Effect.provide(NodeContext.layer),
  runMain,
);
