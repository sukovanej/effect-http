import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import { Api, ExampleServer, NodeServer, RouterBuilder } from "effect-http";

import { debugLogger } from "./_utils";

const responseSchema = Schema.struct({
  name: Schema.string,
  value: Schema.number,
});

const api = pipe(
  Api.api(),
  Api.get("test", "/test", { response: responseSchema }),
);

pipe(
  ExampleServer.make(api),
  RouterBuilder.build,
  NodeServer.listen({ port: 3000 }),
  Effect.provide(debugLogger),
  Effect.runPromise,
);
