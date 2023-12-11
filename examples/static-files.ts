import { NodeContext, Runtime } from "@effect/platform-node";
import { Schema } from "@effect/schema";
import { Effect } from "effect";
import { Api, Middlewares, NodeServer, RouterBuilder } from "effect-http";

import { debugLogger } from "./_utils.js";

const api = Api.api().pipe(
  Api.get("handle", "/handle", {
    response: Schema.string,
  }),
);

const app = RouterBuilder.make(api).pipe(
  RouterBuilder.handle("handle", () => Effect.succeed("Hello World")),
  RouterBuilder.build,
  Middlewares.static({ basePath: "/public", filePath: "public" }),
  Middlewares.accessLog(),
);

app.pipe(
  NodeServer.listen({ port: 3000 }),
  Effect.provide(NodeContext.layer),
  Effect.provide(debugLogger),
  Runtime.runMain,
);
