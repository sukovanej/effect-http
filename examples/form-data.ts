import { FileSystem } from "@effect/platform";
import { HttpServer, NodeContext } from "@effect/platform-node";
import { runMain } from "@effect/platform-node/Runtime";
import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import { Api, HttpSchema, NodeServer, RouterBuilder } from "effect-http";

import { debugLogger } from "./_utils";

const api = pipe(
  Api.api(),
  Api.post("upload", "/upload", {
    request: {
      body: HttpSchema.FormData,
    },
    response: Schema.string,
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
        return file;
      }

      const fs = yield* _(FileSystem.FileSystem);

      return yield* _(fs.readFileString(file[0].path));
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
