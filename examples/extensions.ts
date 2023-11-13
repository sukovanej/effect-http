import { Schema } from "@effect/schema";
import { Effect, Metric, pipe } from "effect";
import { Api, NodeServer, RouterBuilder } from "effect-http";

import { debugLogger } from "./_utils";

const api = pipe(
  Api.api({ title: "Users API" }),
  Api.get(
    "getUser",
    "/user",
    { response: Schema.string },
    { description: "Returns a User by id" },
  ),
  Api.get("metrics", "/metrics", { response: Schema.any }),
);

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("getUser", () => Effect.succeed("Hello")),
  RouterBuilder.handle("metrics", () => Metric.snapshot),
  // TODO
  //Http.prependExtension(Http.uuidLogAnnotationExtension()),
  //Http.addExtension(Http.endpointCallsMetricExtension()),
  //Http.exhaustive,
  RouterBuilder.build,
);

pipe(
  app,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(debugLogger),
  Effect.runPromise,
);
