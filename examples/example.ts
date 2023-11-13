import * as Schema from "@effect/schema/Schema";
import { Context, Effect, Layer, pipe } from "effect";
import { Api, Client, NodeServer, RouterBuilder } from "effect-http";

// Schemas

const milanSchema = Schema.struct({
  penisLength: Schema.number,
  name: Schema.string,
});
const lesnekSchema = Schema.struct({ name: Schema.string });
const standaSchema = Schema.record(
  Schema.string,
  Schema.union(Schema.string, Schema.number),
);

const StuffService = Context.Tag<{ value: number }>();

const dummyStuff = pipe(
  Effect.succeed({ value: 42 }),
  Layer.effect(StuffService),
);

// Api

const api = pipe(
  Api.api({ title: "My awesome pets API", version: "1.0.0" }),
  Api.get("getMilan", "/milan", { response: Schema.string }),
  Api.get("getLesnek", "/lesnek", {
    response: Schema.string,
    request: {
      query: lesnekSchema,
    },
  }),
  Api.get("test", "/test", {
    response: standaSchema,
    request: { query: lesnekSchema },
  }),
  Api.post("standa", "/standa", {
    response: standaSchema,
    request: {
      body: standaSchema,
    },
  }),
  Api.post("handleMilan", "/petr", {
    response: milanSchema,
    request: {
      body: milanSchema,
    },
  }),
  Api.put("callStanda", "/api/zdar", {
    response: Schema.string,
    request: {
      body: Schema.struct({ zdar: Schema.literal("zdar") }),
    },
  }),
);

const app = pipe(
  RouterBuilder.make(api),
  RouterBuilder.handle("handleMilan", ({ body }) =>
    Effect.map(StuffService, ({ value }) => ({
      ...body,
      penisLength: body.penisLength + value,
    })),
  ),
  RouterBuilder.handle("getMilan", () => Effect.succeed("test")),
  RouterBuilder.handle("test", ({ query: { name } }) =>
    Effect.succeed({ name }),
  ),
  RouterBuilder.handle("standa", ({ body }) =>
    Effect.succeed({ ...body, standa: "je borec" }),
  ),
  RouterBuilder.handle("getLesnek", ({ query }) =>
    pipe(
      Effect.succeed(`hello ${query.name}`),
      Effect.tap(() => Effect.logDebug("hello world")),
    ),
  ),
  RouterBuilder.handle("callStanda", () => Effect.succeed("zdar")),
);

const client = Client.client(api, new URL("http://localhost:4000"));

pipe(
  RouterBuilder.build(app),
  NodeServer.listen({ port: 4000 }),
  Effect.flatMap(() => pipe(client.callStanda({ body: { zdar: "zdar" } }))),
  Effect.provide(dummyStuff),
  Effect.runPromise,
);
