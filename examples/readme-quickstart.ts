import * as Schema from "@effect/schema/Schema";
import { Effect, pipe } from "effect";
import { Api, Client, NodeServer, RouterBuilder } from "effect-http";

const responseSchema = Schema.struct({
  name: Schema.string,
  id: pipe(Schema.number, Schema.int(), Schema.positive()),
});
const querySchema = Schema.struct({ id: Schema.NumberFromString });

const api = pipe(
  Api.api({ title: "Users API" }),
  Api.get("getUser", "/user", {
    response: responseSchema,
    request: {
      query: querySchema,
    },
  }),
);

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("getUser", ({ query }) =>
    Effect.succeed({ name: "milan", id: query.id }),
  ),
  RouterBuilder.build,
);

const client = Client.client(api, new URL("http://localhost:3000"));

const callServer = pipe(
  client.getUser({ query: { id: 12 } }),
  Effect.flatMap((user) => Effect.log(`Got ${user.name}, nice!`)),
);

const program = Effect.gen(function* (_) {
  const serverFiber = yield* _(
    app,
    NodeServer.listen({ port: 3000 }),
    Effect.fork,
  );

  yield* _(callServer);

  yield* _(Effect.interruptWith(serverFiber.id()));
});

Effect.runPromise(program);
