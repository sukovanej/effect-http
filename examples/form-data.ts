import { HttpServer, NodeContext } from "@effect/platform-node";
import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
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

const validateFormData = HttpServer.formData.schemaRecord(
  Schema.struct({ file: HttpServer.formData.filesSchema }),
);

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("upload", () =>
    Effect.gen(function* (_) {
      const request = yield* _(HttpServer.request.ServerRequest);

      const formData = yield* _(request.formData);
      const filesRecord = yield* _(validateFormData(formData));
      const files = filesRecord.file;

      if (files.length !== 1) {
        return yield* _(ServerError.invalidBodyError("Expected one file"));
      }

      return yield* _(
        Effect.promise(() => files[0].arrayBuffer()),
        Effect.map((buf) => String(buf)),
      );
    }),
  ),
  RouterBuilder.build,
);

const program = pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(debugLogger),
  Effect.provide(NodeContext.layer),
);

Effect.runPromise(program);
