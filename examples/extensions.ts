import * as Schema from "@effect/schema/Schema";
import { Effect, Metric, pipe } from "effect";
import * as Http from "effect-http";

import { debugLogger } from "./_utils";

const api = pipe(
  Http.api({ title: "Users API" }),
  Http.get(
    "getUser",
    "/user",
    { response: Schema.string },
    { description: "Returns a User by id" },
  ),
  Http.get("metrics", "/metrics", { response: Schema.any }),
);

const server = pipe(
  api,
  Http.server,
  Http.handle("getUser", () => Effect.succeed("Hello")),
  Http.handle("metrics", () => Metric.snapshot),
  Http.prependExtension(Http.uuidLogAnnotationExtension()),
  Http.addExtension(Http.endpointCallsMetricExtension()),
  Http.exhaustive,
);

pipe(
  server,
  Http.listen({ port: 3000 }),
  Effect.provide(debugLogger),
  Effect.runPromise,
);
