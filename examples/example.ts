import * as Log from "effect-log";

import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as S from "@effect/schema/Schema";

import * as Http from "../src";

// Schemas

const milanSchema = S.struct({ penisLength: S.number, name: S.string });
const lesnekSchema = S.struct({ name: S.string });
const standaSchema = S.record(S.string, S.union(S.string, S.number));

const StuffService = Context.Tag<{ value: number }>();

const dummyStuff = pipe(
  Effect.succeed({ value: 42 }),
  Effect.toLayer(StuffService),
);

// Handlers

const handleMilan = ({ body }: Http.Input<typeof api, "handleMilan">) =>
  Effect.map(StuffService, ({ value }) => ({
    ...body,
    penisLength: body.penisLength + value,
  }));

const handleStanda = ({ body }: Http.Input<typeof api, "standa">) =>
  Effect.succeed({ ...body, standa: "je borec" });

const handleTest = ({ query: { name } }: Http.Input<typeof api, "test">) =>
  Effect.succeed({ name });

const handleLesnek = ({ query }: Http.Input<typeof api, "getLesnek">) =>
  pipe(
    Effect.succeed(`hello ${query.name}`),
    Effect.tap(() => Effect.logDebug("hello world")),
  );

// Api

const api = pipe(
  Http.api({ title: "My awesome pets API", version: "1.0.0" }),
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
  Http.server,
  Http.handle("getMilan", () => Effect.succeed("test")),
  Http.handle("test", handleTest),
  Http.handle("handleMilan", handleMilan),
  Http.provideLayer(dummyStuff),
  Http.handle("standa", handleStanda),
  Http.handle("getLesnek", handleLesnek),
  Http.handle("callStanda", () => Effect.succeed("zdar")),
  Http.setLogger(Log.pretty),
);

const client = pipe(api, Http.client(new URL("http://localhost:4000")));

pipe(
  server,
  Http.listen(4000),
  Effect.flatMap(({ address, port }) =>
    Effect.logInfo(`Listening on ${address}:${port}`),
  ),
  Effect.flatMap(() => pipe(client.callStanda({ body: { zdar: "zdar" } }))),
  Effect.provideLayer(Log.usePrettyLogger),
  Effect.runPromise,
);
