import express from "express";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Logger from "@effect/io/Logger";
import * as LogLevel from "@effect/io/Logger/Level";
import * as Schema from "@effect/schema/Schema";

import * as Http from "effect-http";

const legacyApp = express();

legacyApp.get("/legacy-endpoint", (_, res) => {
  res.json({ hello: "world" });
});

const api = pipe(
  Http.api(),
  Http.get("newEndpoint", "/new-endpoint", {
    response: Schema.struct({ hello: Schema.string }),
  }),
);

const server = pipe(
  Http.server(api),
  Http.handle("newEndpoint", () => Effect.succeed({ hello: "new world" })),
  Http.exhaustive,
);

pipe(
  server,
  Http.express({ openapiPath: "/docs-new" }),
  Effect.map((app) => {
    app.use(legacyApp);
    return app;
  }),
  Effect.flatMap(Http.listenExpress()),
  Effect.provideSomeLayer(Logger.minimumLogLevel(LogLevel.All)),
  Effect.runPromise,
);
