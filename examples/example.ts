import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Logger from "@effect/io/Logger";
import * as S from "@effect/schema/Schema";

import * as Http from "../src";
import { prettyLogger } from "./_logger";

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

const handleMilan = ({ body }: Http.Body<Milan>) =>
  Effect.map(StuffService, ({ value }) => ({
    ...body,
    penisLength: body.penisLength + value,
  }));

const handleStanda = ({ body }: Http.Body<Standa>) =>
  Effect.succeed({ ...body, standa: "je borec" });

const handleTest = ({ query: { name } }: Http.Query<Lesnek>) =>
  Effect.succeed({ name });

const handleLesnek = ({ query }: Http.Query<Lesnek>) =>
  pipe(
    Effect.succeed(`hello ${query.name}`),
    Effect.tap(() => Effect.logDebug("hello world")),
  );

// Api

const api = pipe(
  Http.api(),
  Http.get("getMilan", "/milan", { response: S.string }),
  Http.get("getLesnek", "/lesnek", { response: S.string, query: lesnekSchema }),
  Http.get("test", "/test", { response: standaSchema, query: lesnekSchema }),
  Http.post("standa", "/standa", {
    response: standaSchema,
    body: standaSchema,
  }),
  Http.post("handleMilan", "/petr", {
    response: milanSchema,
    body: milanSchema,
  }),
  Http.put("callStanda", "/api/zdar", {
    response: S.string,
    body: S.struct({ zdar: S.literal("zdar") }),
  }),
);

// Server

const server = pipe(
  api,
  Http.server("My awesome pets API", "1.0.0"),
  Http.handle("getMilan", () => Effect.succeed("test")),
  Http.handle("test", handleTest),
  Http.handle("handleMilan", handleMilan),
  Http.provideLayer(dummyStuff),
  Http.handle("standa", handleStanda),
  Http.handle("getLesnek", handleLesnek),
  Http.handle("callStanda", () => Effect.succeed("zdar")),
  Http.provideLayer(Logger.replace(Logger.defaultLogger, prettyLogger)),
);

const client = pipe(api, Http.client(new URL("http://localhost:4000")));

pipe(
  server,
  Http.listen(4000),
  Effect.flatMap(({ address, port }) =>
    Effect.logInfo(`Listening on ${address}:${port}`),
  ),
  Effect.flatMap(() => pipe(client.callStanda({ body: { zdar: "zdar" } }))),
  Effect.provideLayer(Logger.replace(Logger.defaultLogger, prettyLogger)),
  Effect.runPromise,
);
