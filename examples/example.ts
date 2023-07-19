import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";
import * as Schema from "@effect/schema/Schema";

import * as Http from "effect-http";

// Schemas

const milanSchema = Schema.struct({
  penisLength: Schema.number,
  name: Schema.string,
});
const lesnekSchema = { name: Schema.string };
const standaSchema = Schema.record(
  Schema.string,
  Schema.union(Schema.string, Schema.number),
);

const StuffService = Context.Tag<{ value: number }>();

const dummyStuff = pipe(
  Effect.succeed({ value: 42 }),
  Layer.effect(StuffService),
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
  Http.get("getMilan", "/milan", { response: Schema.string }),
  Http.get("getLesnek", "/lesnek", {
    response: Schema.string,
    query: lesnekSchema,
  }),
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
    response: Schema.string,
    body: Schema.struct({ zdar: Schema.literal("zdar") }),
  }),
);

// Server

const server = pipe(
  api,
  Http.server,
  Http.handle("getMilan", () => Effect.succeed("test")),
  Http.handle("test", handleTest),
  Http.handle("handleMilan", handleMilan),
  Http.handle("standa", handleStanda),
  Http.handle("getLesnek", handleLesnek),
  Http.handle("callStanda", () => Effect.succeed("zdar")),
);

const client = pipe(api, Http.client(new URL("http://localhost:4000")));

pipe(
  server,
  Http.listen({ port: 4000 }),
  Effect.flatMap(() => pipe(client.callStanda({ body: { zdar: "zdar" } }))),
  Effect.provideLayer(dummyStuff),
  Effect.runPromise,
);
