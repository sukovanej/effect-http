import * as Http from "effect-http";

import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";

interface Resource {
  value: number;
}

const ResourceService = Context.Tag<Resource>();

const resource = Effect.acquireRelease(
  pipe(
    Effect.log("Acquried resource"),
    Effect.as({ value: 2 } satisfies Resource),
  ),
  () => Effect.log("Released resource"),
);

const api = pipe(
  Http.api(),
  Http.get("test", "/test", { response: Schema.string }),
);

const server = pipe(
  Http.server(api),
  Http.handle("test", () =>
    Effect.map(ResourceService, ({ value }) => `There you go: ${value}`),
  ),
);

pipe(
  server,
  Http.listen({ port: 3000 }),
  Effect.provideServiceEffect(ResourceService, resource),
  Effect.scoped,
  Effect.runPromise,
);
