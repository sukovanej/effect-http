import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

import * as Api from "../src/api";
import * as Express from "../src/express";
import * as Server from "../src/server";

// Schemas

const milanSchema = S.struct({
  penisLength: S.number,
  name: S.string,
});

type Milan = S.To<typeof milanSchema>;

const lesnekSchema = S.struct({ name: S.string });

type Lesnek = S.To<typeof lesnekSchema>;

const standaSchema = S.record(S.string, S.union(S.string, S.number));

type Standa = S.To<typeof standaSchema>;

interface Stuff {
  value: number;
}

const StuffService = Context.Tag<Stuff>();

const dummyStuff = pipe(
  Effect.succeed({ value: 42 }),
  Effect.toLayer(StuffService),
);

// Handlers

const handleMilan = ({ body }: Server.BodyInput<Milan>) =>
  Effect.map(StuffService, ({ value }) => ({
    ...body,
    penisLength: body.penisLength + value,
  }));

const handleStanda = ({ body }: Server.BodyInput<Standa>) =>
  Effect.succeed({ ...body, standa: "je borec" });

const handleTest = ({ query: { name } }: Server.QueryInput<Lesnek>) =>
  Effect.succeed({ name });

const handleLesnek = ({ query }: Server.QueryInput<Lesnek>) =>
  pipe(
    Effect.succeed(`hello ${query.name}`),
    Effect.tap(() => Effect.logDebug("hello world")),
  );

// Api

const api = pipe(
  Api.make(),
  Api.get("milan", "/milan", { response: S.string }),
  Api.get("lesnek", "/lesnek", { response: S.string, query: lesnekSchema }),
  Api.get("test", "/test", { response: standaSchema, query: lesnekSchema }),
  Api.post("standa", "/standa", { response: standaSchema, body: standaSchema }),
  Api.post("milan-2", "/milan-2", { response: milanSchema, body: milanSchema }),
);

// Server

const server = pipe(
  api,
  Server.make("My awesome pets API", "1.0.0"),
  Server.handle("milan", () => Effect.succeed("test")),
  Server.handle("lesnek", handleLesnek),
  Server.handle("test", handleTest),
  Server.handle("standa", handleStanda),
  Server.handle("milan-2", handleMilan),
  Server.provideLayer(dummyStuff),
);

pipe(
  server,
  Express.listen(4000),
  Effect.flatMap(({ address, port }) =>
    Effect.logInfo(`Listening on ${address}:${port}`),
  ),
  Effect.runPromise,
);
