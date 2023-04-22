import * as Http from "effect-http";
import express from "express";

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

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

//const app = pipe(server, Http.express());
//app.use(legacyApp);
//app.listen(3000, () => console.log("Listening on 3000"));

const app = pipe(server, Http.express({ openapiPath: "/docs-new" }));

legacyApp.use(app);
legacyApp.listen(3000, () => console.log("Listening on 3000"));
